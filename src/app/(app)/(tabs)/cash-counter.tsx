import React, { useCallback, useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput, // Added TextInput
} from "react-native";
import {
  DollarSign,
  Receipt,
  CheckCircle,
  X,
  CreditCard,
  Banknote,
  Smartphone,
  RefreshCw,
  Clock,
  User,
  MapPin,
  Search, // Added Search icon
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";

// Import your global auth store
import { useAuthStore } from "../../../store/authStore"; // Adjust path as needed

const API_URL = Constants.expoConfig?.extra?.API_URL;

// =========================================================
// TYPES
// =========================================================

type PaymentMethod = "cash" | "card" | "mobile-banking";

type OrderVariant = {
  id?: string | null;
  name?: string | null;
  price?: number | null;
};

type CashierOrderItem = {
  _id: string;
  name: string;
  quantity: number;
  price: number;
  variant?: OrderVariant | null;
  customizations?: string;
};

type CashierOrder = {
  _id: string;
  orderNumber: string;

  customer: {
    name: string;
    phone: string;
    address: string;
  };

  items: CashierOrderItem[];

  orderType: "dine-in" | "takeaway" | "delivery";

  tableNumber: string | null;

  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;

  orderStatus: "pending" | "preparing" | "completed" | "cancelled";

  paymentStatus: "unpaid" | "paid" | "refunded";

  paymentMethod: "cash" | "card" | "mobile-banking" | "online" | "due";

  staff?: {
    _id?: string;
    id?: string;
    name: string;
    role: string;
  } | null;

  staffName?: string;

  notes: string;

  createdAt: string;
  updatedAt: string;
};

// =========================================================
// HELPER COMPONENTS
// =========================================================

function Header({ count }: { count: number }) {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerLeft}>
        <View style={styles.headerIconContainer}>
          <Receipt size={22} color="#FFF" />
        </View>
        <View>
          <Text style={styles.headerTitle}>Cashier Counter</Text>
          <Text style={styles.headerSubtitle}>Manage Bills & Payments</Text>
        </View>
      </View>
      <View style={styles.headerCounterBadge}>
        <Text style={styles.headerCounterText}>{count}</Text>
      </View>
    </View>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.receiptSubRow}>
      <Text style={styles.receiptLabel}>{label}</Text>
      <Text style={styles.receiptValue}>{value}</Text>
    </View>
  );
}

// =========================================================
// MAIN SCREEN
// =========================================================

export default function CashierScreen() {
  const [orders, setOrders] = useState<CashierOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<CashierOrder | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  
  // Search query state for table number filtering
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [error, setError] = useState("");

  // Retrieve user role dynamically from authStore
  const userRole = useAuthStore((state: any) => state.userRole || state.user?.role);

  // =======================================================
  // FETCH ORDERS
  // =======================================================

  const fetchOrders = useCallback(async (isRefresh = false, isBackground = false) => {
    if (!API_URL) {
      setError("API URL is not configured.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else if (!isBackground) {
      setLoading(true);
    }

    try {
      if (!isBackground) {
        setError("");
      }

      const response = await fetch(`${API_URL}/api/admin/order/getOrder`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      let data: any;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          `Server returned an invalid response (${response.status}).`
        );
      }

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Failed to load orders.");
      }

      const allOrders: CashierOrder[] = Array.isArray(data.orders)
        ? data.orders
        : [];

      // Cashier only needs: completed + unpaid orders
      const unpaidOrders = allOrders.filter(
        (order) =>
          order.orderStatus === "completed" &&
          order.paymentStatus === "unpaid"
      );

      setOrders(unpaidOrders);
    } catch (err: any) {
      console.error("Cashier fetch orders error:", err);
      if (!isBackground) {
        setError(err?.message || "Unable to load orders.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // =======================================================
  // INITIAL LOAD & AUTO-REFRESH (Every 15s)
  // =======================================================

  useEffect(() => {
    fetchOrders();

    // Set up interval for auto-refreshing every 15 seconds
    const intervalId = setInterval(() => {
      fetchOrders(false, true); // pass true for isBackground so it doesn't trigger loading spinners
    }, 15000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [fetchOrders]);

  // =======================================================
  // REFRESH
  // =======================================================

  const handleRefresh = () => {
    if (refreshing) return;
    fetchOrders(true);
  };

  // =======================================================
  // OPEN PAYMENT MODAL (WITH ADMIN CHECK)
  // =======================================================

  const openPaymentModal = (order: CashierOrder) => {
    const normalizedRole = typeof userRole === "string" ? userRole.toLowerCase() : "";
    
    // Restrict access: Only allow if role is explicitly "admin"
    if (normalizedRole !== "admin") {
      Alert.alert(
        "Access Denied",
        "Only administrators are authorized to proceed to checkout."
      );
      return;
    }

    setSelectedOrder(order);
    setPaymentMethod("cash");
    setIsPaymentModalVisible(true);
    setError("");
  };

  // =======================================================
  // CLOSE PAYMENT MODAL
  // =======================================================

  const closePaymentModal = () => {
    if (processingPayment) return;
    setIsPaymentModalVisible(false);
    setSelectedOrder(null);
  };

  // =======================================================
  // UPDATE PAYMENT STATUS
  // =======================================================

  const handleCompletePayment = async () => {
    if (!selectedOrder) return;

    if (!API_URL) {
      setError("API URL is not configured.");
      return;
    }

    try {
      setProcessingPayment(true);
      setError("");

      const response = await fetch(`${API_URL}/api/admin/order/payment`, {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: selectedOrder._id,
          paymentStatus: "paid",
          paymentMethod,
        }),
      });

      let data: any;

      try {
        data = await response.json();
      } catch {
        throw new Error("Server returned an invalid response.");
      }

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Failed to update payment status.");
      }

      // Remove the now-paid order from cashier queue
      setOrders((previousOrders) =>
        previousOrders.filter((order) => order._id !== selectedOrder._id)
      );

      setIsPaymentModalVisible(false);
      setSelectedOrder(null);
      setSuccessMessage(true);

      setTimeout(() => {
        setSuccessMessage(false);
      }, 3000);
    } catch (err: any) {
      console.error("Payment update error:", err);
      setError(err?.message || "Payment could not be completed.");
    } finally {
      setProcessingPayment(false);
    }
  };

  // =======================================================
  // HELPERS & FILTERING
  // =======================================================

  const getOrderLocation = (order: CashierOrder) => {
    if (order.orderType === "dine-in") {
      return order.tableNumber
        ? `Table ${order.tableNumber.replace(/^Table\s+/i, "")}`
        : "Dine-in";
    }

    if (order.orderType === "takeaway") {
      return "Takeaway";
    }

    return "Delivery";
  };

  const getStaffName = (order: CashierOrder) => {
    return order.staffName || order.staff?.name || "Unassigned";
  };

  const formatOrderTime = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter orders based on table number matching the search query
  const filteredOrders = orders.filter((order) => {
    if (!searchQuery.trim()) return true;
    if (!order.tableNumber) return false;
    // Cleans table string to compare numbers easily (e.g. "Table 4" -> matches "4")
    const cleanTableNum = order.tableNumber.replace(/^Table\s+/i, "").toLowerCase();
    return cleanTableNum.includes(searchQuery.trim().toLowerCase());
  });

  // =======================================================
  // LOADING UI
  // =======================================================

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0B3C29" />
        <SafeAreaView style={styles.safeAreaHeader} edges={["top"]}>
          <Header count={0} />
        </SafeAreaView>
        <View style={styles.mainContent}>
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#FF7A00" />
            <Text style={styles.loadingText}>Loading bills...</Text>
          </View>
        </View>
      </View>
    );
  }

  // =======================================================
  // MAIN UI
  // =======================================================

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B3C29" />

      {/* Fixed Header Container matching background */}
      <SafeAreaView style={styles.safeAreaHeader} edges={["top"]}>
        <Header count={orders.length} />
      </SafeAreaView>

      <View style={styles.mainContent}>
        {/* SUCCESS */}
        {successMessage && (
          <View style={styles.successBanner}>
            <CheckCircle color="#FFF" size={18} style={{ marginRight: 8 }} />
            <Text style={styles.successText}>Payment received successfully!</Text>
          </View>
        )}

        {/* ERROR */}
        {error !== "" && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              onPress={() => fetchOrders(true)}
              style={styles.retryButton}
            >
              <RefreshCw color="#FFF" size={15} />
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#FF7A00"
              colors={["#FF7A00"]}
            />
          }
        >
          {/* SEARCH BAR */}
          <View style={styles.searchContainer}>
            <Search size={18} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Filter by table number (e.g. 4)..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              keyboardType="number-pad"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <X size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {/* SECTION HEADER */}
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Orders Awaiting Payment</Text>
              <Text style={styles.sectionSubtitle}>
                Completed orders ready for checkout
              </Text>
            </View>

            <View style={styles.pendingBadge}>
              <Clock size={14} color="#FF7A00" />
              <Text style={styles.pendingBadgeText}>{filteredOrders.length} Pending</Text>
            </View>
          </View>

          {/* EMPTY */}
          {filteredOrders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <DollarSign color="#FF7A00" size={36} />
              </View>

              <Text style={styles.emptyText}>
                {searchQuery ? "No bills found for this table" : "All bills are settled!"}
              </Text>
              <Text style={styles.emptySubText}>
                {searchQuery
                  ? "Try searching for a different table number."
                  : "No completed unpaid orders are waiting for payment."}
              </Text>

              {!searchQuery && (
                <TouchableOpacity
                  style={styles.refreshEmptyButton}
                  onPress={() => fetchOrders(true)}
                  disabled={refreshing}
                  activeOpacity={0.8}
                >
                  {refreshing ? (
                    <ActivityIndicator size="small" color="#0B3C29" />
                  ) : (
                    <RefreshCw size={16} color="#0B3C29" />
                  )}
                  <Text style={styles.refreshEmptyText}>Refresh</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredOrders.map((order) => (
              <View key={order._id} style={styles.billCard}>
                {/* TOP */}
                <View style={styles.billTopRow}>
                  <View style={styles.orderIdGroup}>
                    <View style={styles.divider} />
                    <Text style={styles.tableText}>
                      {getOrderLocation(order)}
                    </Text>
                  </View>

                  <Text style={styles.totalAmountText}>
                    ৳{order.subtotal.toFixed(2)}
                  </Text>
                </View>

                {/* COMPLETED */}
                <View style={styles.completedBadge}>
                  <CheckCircle size={13} color="#059669" />
                  <Text style={styles.completedBadgeText}>Order Completed</Text>
                </View>

                {/* META */}
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <User size={13} color="#6B7280" />
                    <Text style={styles.metaText}>Order placed by : {getStaffName(order)}</Text>
                  </View>

                  <View style={styles.metaItem}>
                    <Clock size={13} color="#6B7280" />
                    <Text style={styles.metaText}>
                      {formatOrderTime(order.updatedAt || order.createdAt)}
                    </Text>
                  </View>
                </View>

                {/* CUSTOMER */}
                {order.customer?.name &&
                  order.customer.name !== "Walk-in Customer" && (
                    <View style={styles.customerRow}>
                      <User size={13} color="#6B7280" />
                      <Text style={styles.customerInfo}>
                        {order.customer.name}
                      </Text>
                      {order.customer.phone && (
                        <Text style={styles.customerPhone}>
                          • {order.customer.phone}
                        </Text>
                      )}
                    </View>
                  )}

                {/* ITEMS */}
                <View style={styles.itemListPreview}>
                  {order.items.map((item) => (
                    <View key={item._id} style={styles.itemPreviewContainer}>
                      <View style={styles.itemPreviewRow}>
                        <Text
                          style={styles.itemPreviewText}
                          numberOfLines={1}
                        >
                          • {item.quantity}x {item.name}
                        </Text>
                        <Text style={styles.itemPrice}>
                          ৳{(item.price * item.quantity).toFixed(2)}
                        </Text>
                      </View>

                      {item.variant?.name && (
                        <Text style={styles.variantText}>
                          Variant: {item.variant.name}
                        </Text>
                      )}

                      {item.customizations && (
                        <Text
                          style={styles.customizationText}
                          numberOfLines={2}
                        >
                          Note: {item.customizations}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>

                {/* ORDER NOTE */}
                {order.notes?.trim() && (
                  <View style={styles.notesBox}>
                    <Text style={styles.notesLabel}>Order Note</Text>
                    <Text style={styles.notesText}>{order.notes}</Text>
                  </View>
                )}

                {/* DISCOUNT */}
                {order.discount > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Discount</Text>
                    <Text style={styles.discountText}>
                      -৳{order.discount.toFixed(2)}
                    </Text>
                  </View>
                )}

                {/* CHECKOUT */}
                <TouchableOpacity
                  style={styles.checkoutButton}
                  onPress={() => openPaymentModal(order)}
                  activeOpacity={0.8}
                >
                  <DollarSign
                    color="#FFF"
                    size={19}
                    style={{ marginRight: 5 }}
                  />
                  <Text style={styles.checkoutButtonText}>
                    Proceed to Checkout
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>

      {/* ===================================================
          PAYMENT MODAL
      =================================================== */}

      <Modal
        visible={isPaymentModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closePaymentModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* HEADER */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Checkout Bill</Text>
                <Text style={styles.modalOrderNumber}>
                  #{selectedOrder?.orderNumber}
                </Text>
              </View>

              <TouchableOpacity
                onPress={closePaymentModal}
                disabled={processingPayment}
                style={styles.closeButton}
              >
                <X color="#333" size={22} />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalScrollContent}
              >
                {/* ORDER INFO */}
                <View style={styles.modalInfoCard}>
                  <View style={styles.modalInfoRow}>
                    <MapPin size={15} color="#0B3C29" />
                    <Text style={styles.modalInfoText}>
                      {getOrderLocation(selectedOrder)}
                    </Text>
                  </View>

                  <View style={styles.modalInfoRow}>
                    <User size={15} color="#0B3C29" />
                    <Text style={styles.modalInfoText}>
                      Served by: {getStaffName(selectedOrder)}
                    </Text>
                  </View>

                  {selectedOrder.customer?.name &&
                    selectedOrder.customer.name !== "Walk-in Customer" && (
                      <View style={styles.modalInfoRow}>
                        <User size={15} color="#0B3C29" />
                        <Text style={styles.modalInfoText}>
                          Customer: {selectedOrder.customer.name}
                        </Text>
                      </View>
                    )}
                </View>

                {/* RECEIPT */}
                <View style={styles.receiptBox}>
                  <Text style={styles.receiptSectionTitle}>Order Summary</Text>

                  {selectedOrder.items.map((item) => (
                    <View key={item._id} style={styles.receiptItemContainer}>
                      <View style={styles.receiptLine}>
                        <Text style={styles.receiptItemName}>
                          {item.quantity}x {item.name}
                        </Text>
                        <Text style={styles.receiptItemPrice}>
                          ৳{(item.price * item.quantity).toFixed(2)}
                        </Text>
                      </View>

                      {item.variant?.name && (
                        <Text style={styles.receiptVariant}>
                          {item.variant.name}
                        </Text>
                      )}

                      {item.customizations && (
                        <Text style={styles.receiptCustomization}>
                          {item.customizations}
                        </Text>
                      )}
                    </View>
                  ))}

                  <View style={styles.receiptDivider} />

                  <ReceiptRow
                    label="Subtotal"
                    value={`৳${selectedOrder.subtotal.toFixed(2)}`}
                  />

                  {selectedOrder.tax > 0 && (
                    <ReceiptRow
                      label="VAT / Tax"
                      value={`৳${selectedOrder.tax.toFixed(2)}`}
                    />
                  )}

                  {selectedOrder.discount > 0 && (
                    <View style={styles.receiptSubRow}>
                      <Text style={styles.receiptLabel}>Discount</Text>
                      <Text style={styles.discountText}>
                        -৳{selectedOrder.discount.toFixed(2)}
                      </Text>
                    </View>
                  )}

                  <View
                    style={[styles.receiptSubRow, styles.finalRow]}
                  >
                    <Text style={styles.finalLabel}>Total Payable</Text>
                    <Text style={styles.finalVal}>
                      ৳{selectedOrder.subtotal.toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* PAYMENT METHOD */}
                <Text style={styles.paymentMethodTitle}>
                  Select Payment Mode
                </Text>

                <View style={styles.paymentMethodsRow}>
                  {(
                    ["cash", "card", "mobile-banking"] as PaymentMethod[]
                  ).map((method) => {
                    const active = paymentMethod === method;

                    return (
                      <TouchableOpacity
                        key={method}
                        style={[
                          styles.methodCard,
                          active && styles.methodCardActive,
                        ]}
                        onPress={() => setPaymentMethod(method)}
                        disabled={processingPayment}
                        activeOpacity={0.8}
                      >
                        {method === "cash" && (
                          <Banknote
                            color={active ? "#FF7A00" : "#666"}
                            size={21}
                          />
                        )}

                        {method === "card" && (
                          <CreditCard
                            color={active ? "#FF7A00" : "#666"}
                            size={21}
                          />
                        )}

                        {method === "mobile-banking" && (
                          <Smartphone
                            color={active ? "#FF7A00" : "#666"}
                            size={21}
                          />
                        )}

                        <Text
                          style={[
                            styles.methodText,
                            active && styles.methodTextActive,
                          ]}
                        >
                          {method === "mobile-banking"
                            ? "Mobile Banking"
                            : method.charAt(0).toUpperCase() +
                              method.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* PAY BUTTON */}
                <TouchableOpacity
                  style={[
                    styles.completePaymentBtn,
                    processingPayment && styles.disabledButton,
                  ]}
                  onPress={handleCompletePayment}
                  disabled={processingPayment}
                  activeOpacity={0.8}
                >
                  {processingPayment ? (
                    <>
                      <ActivityIndicator color="#FFF" size="small" />
                      <Text
                        style={[
                          styles.completePaymentText,
                          { marginLeft: 8 },
                        ]}
                      >
                        Processing Payment...
                      </Text>
                    </>
                  ) : (
                    <>
                      <CheckCircle
                        color="#FFF"
                        size={20}
                        style={{ marginRight: 8 }}
                      />
                      <Text style={styles.completePaymentText}>
                        Mark as Paid
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <Text style={styles.paymentConfirmationText}>
                  This will mark the order as paid.
                </Text>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// =========================================================
// STYLES
// =========================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B3C29",
  },
  safeAreaHeader: {
    backgroundColor: "#0B3C29",
  },
  mainContent: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#4B5563",
    fontWeight: "500",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#0B3C29",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#D1D5DB",
  },
  headerCounterBadge: {
    backgroundColor: "#FF7A00",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  headerCounterText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#059669",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  successText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#EF4444",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  errorText: {
    color: "#FFF",
    flex: 1,
    fontSize: 13,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  retryText: {
    color: "#FFF",
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "600",
  },
  scrollContainer: {
    padding: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1F2937",
    padding: 0,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#6B7280",
  },
  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#D97706",
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 6,
  },
  emptySubText: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
  },
  refreshEmptyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF7A00",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  refreshEmptyText: {
    color: "#0B3C29",
    fontWeight: "700",
    marginLeft: 6,
  },
  billCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  billTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderIdGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  divider: {
    width: 3,
    height: 14,
    backgroundColor: "#FF7A00",
    borderRadius: 2,
    marginRight: 6,
  },
  tableText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B5563",
  },
  totalAmountText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#059669",
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 10,
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#059669",
    marginLeft: 4,
  },
  metaRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  metaText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
  },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  customerInfo: {
    fontSize: 12,
    color: "#4B5563",
    marginLeft: 4,
    fontWeight: "500",
  },
  customerPhone: {
    fontSize: 12,
    color: "#6B7280",
  },
  itemListPreview: {
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 8,
    marginBottom: 8,
  },
  itemPreviewContainer: {
    marginBottom: 6,
  },
  itemPreviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemPreviewText: {
    fontSize: 13,
    color: "#374151",
    flex: 1,
    marginRight: 8,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937",
  },
  variantText: {
    fontSize: 11,
    color: "#6B7280",
    marginLeft: 12,
    marginTop: 2,
  },
  customizationText: {
    fontSize: 11,
    color: "#D97706",
    marginLeft: 12,
    marginTop: 2,
  },
  notesBox: {
    backgroundColor: "#FFFBEB",
    borderRadius: 6,
    padding: 8,
    marginTop: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#FEF3C7",
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#D97706",
    marginBottom: 2,
  },
  notesText: {
    fontSize: 12,
    color: "#78350F",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: "#6B7280",
  },
  discountText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#EF4444",
  },
  checkoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0B3C29",
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 8,
  },
  checkoutButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  modalOrderNumber: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  modalScrollContent: {
    padding: 20,
  },
  modalInfoCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  modalInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  modalInfoText: {
    fontSize: 13,
    color: "#374151",
    marginLeft: 8,
    fontWeight: "500",
  },
  receiptBox: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 20,
  },
  receiptSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
  },
  receiptItemContainer: {
    marginBottom: 8,
  },
  receiptLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  receiptItemName: {
    fontSize: 13,
    color: "#374151",
    flex: 1,
  },
  receiptItemPrice: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937",
  },
  receiptVariant: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 1,
  },
  receiptCustomization: {
    fontSize: 11,
    color: "#D97706",
    marginTop: 1,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },
  receiptSubRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  receiptLabel: {
    fontSize: 13,
    color: "#6B7280",
  },
  receiptValue: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
  },
  finalRow: {
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 8,
    marginBottom: 0,
  },
  finalLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
  },
  finalVal: {
    fontSize: 16,
    fontWeight: "700",
    color: "#059669",
  },
  paymentMethodTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
  },
  paymentMethodsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  methodCard: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  methodCardActive: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FF7A00",
  },
  methodText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginTop: 6,
  },
  methodTextActive: {
    color: "#D97706",
  },
  completePaymentBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#059669",
    borderRadius: 12,
    paddingVertical: 14,
  },
  disabledButton: {
    opacity: 0.6,
  },
  completePaymentText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 15,
  },
  paymentConfirmationText: {
    textAlign: "center",
    fontSize: 12,
    color: "#6B7280",
    marginTop: 10,
  },
});