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
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";

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

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [error, setError] = useState("");

  // =======================================================
  // FETCH ORDERS
  // =======================================================

  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (!API_URL) {
      setError("API URL is not configured.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      setError("");

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
      setError(err?.message || "Unable to load orders.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // =======================================================
  // INITIAL LOAD
  // =======================================================

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // =======================================================
  // REFRESH
  // =======================================================

  const handleRefresh = () => {
    if (refreshing) return;
    fetchOrders(true);
  };

  // =======================================================
  // OPEN PAYMENT MODAL
  // =======================================================

  const openPaymentModal = (order: CashierOrder) => {
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
  // HELPERS
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

  // =======================================================
  // LOADING UI
  // =======================================================

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0B3C29" />
        <Header count={0} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF7A00" />
          <Text style={styles.loadingText}>Loading bills...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // =======================================================
  // MAIN UI
  // =======================================================

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0B3C29" />

      <Header count={orders.length} />

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
            <Text style={styles.pendingBadgeText}>{orders.length} Pending</Text>
          </View>
        </View>

        {/* EMPTY */}
        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <DollarSign color="#FF7A00" size={36} />
            </View>

            <Text style={styles.emptyText}>All bills are settled!</Text>
            <Text style={styles.emptySubText}>
              No completed unpaid orders are waiting for payment.
            </Text>

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
          </View>
        ) : (
          orders.map((order) => (
            <View key={order._id} style={styles.billCard}>
              {/* TOP */}
              <View style={styles.billTopRow}>
                <View style={styles.orderIdGroup}>
                  {/* <Text style={styles.orderIdText}>#{order.orderNumber}</Text> */}
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
    </SafeAreaView>
  );
}

// =========================================================
// STYLES
// =========================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    // backgroundColor: "#F9FAFB",
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
    paddingVertical: 12,
    backgroundColor: "#0B3C29",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
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
    // backgroundColor: "#F3F4F6",
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  orderIdText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: "#D1D5DB",
    marginHorizontal: 8,
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
    paddingVertical: 2,
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
  },
  itemPreviewText: {
    fontSize: 13,
    color: "#374151",
    flex: 1,
  },
  itemPrice: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
  },
  variantText: {
    fontSize: 11,
    color: "#6B7280",
    marginLeft: 12,
  },
  customizationText: {
    fontSize: 11,
    color: "#D97706",
    marginLeft: 12,
  },
  notesBox: {
    backgroundColor: "#FFFBEB",
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#B45309",
    marginBottom: 2,
  },
  notesText: {
    fontSize: 12,
    color: "#92400E",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 13,
    color: "#6B7280",
  },
  discountText: {
    fontSize: 13,
    color: "#DC2626",
    fontWeight: "500",
  },
  checkoutButton: {
    backgroundColor: "#0B3C29",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 8,
  },
  checkoutButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  modalOrderNumber: {
    fontSize: 12,
    color: "#6B7280",
  },
  closeButton: {
    padding: 4,
  },
  modalScrollContent: {
    padding: 16,
  },
  modalInfoCard: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
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
  },
  receiptBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  receiptSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  receiptItemContainer: {
    marginBottom: 8,
  },
  receiptLine: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  receiptItemName: {
    fontSize: 13,
    color: "#374151",
    flex: 1,
  },
  receiptItemPrice: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
  },
  receiptVariant: {
    fontSize: 11,
    color: "#6B7280",
    marginLeft: 10,
  },
  receiptCustomization: {
    fontSize: 11,
    color: "#D97706",
    marginLeft: 10,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 8,
  },
  receiptSubRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  receiptLabel: {
    fontSize: 13,
    color: "#4B5563",
  },
  receiptValue: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "500",
  },
  finalRow: {
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 8,
  },
  finalLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  finalVal: {
    fontSize: 16,
    fontWeight: "700",
    color: "#059669",
  },
  paymentMethodTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  paymentMethodsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  methodCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginHorizontal: 4,
    backgroundColor: "#FFF",
  },
  methodCardActive: {
    borderColor: "#FF7A00",
    backgroundColor: "#FFFBEB",
  },
  methodText: {
    fontSize: 11,
    color: "#4B5563",
    marginTop: 6,
    fontWeight: "500",
  },
  methodTextActive: {
    color: "#FF7A00",
    fontWeight: "700",
  },
  completePaymentBtn: {
    backgroundColor: "#059669",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  completePaymentText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },
  paymentConfirmationText: {
    textAlign: "center",
    fontSize: 11,
    color: "#6B7280",
    marginTop: 8,
  },
});