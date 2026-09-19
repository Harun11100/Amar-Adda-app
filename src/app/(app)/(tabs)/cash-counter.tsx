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
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig?.extra?.API_URL;

type PaymentMethod = "cash" | "card" | "mobile-banking";

type CashierOrderItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  customizations?: string;
};

type CashierOrder = {
  id: string;
  orderNumber: string;
  customer: { name: string; phone: string; address: string };
  items: CashierOrderItem[];
  orderType: "dine-in" | "takeaway" | "delivery";
  tableNumber: string | null;
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  staff: { id: string; name: string; role: string } | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export default function CashierScreen() {
  const [orders, setOrders] = useState<CashierOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<CashierOrder | null>(null);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [successMessage, setSuccessMessage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async () => {
    try {
      setError("");
      const response = await fetch(`${API_URL}/api/orders/cashier`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load cashier orders.");
      }
      setOrders(data.orders || []);
    } catch (err: any) {
      setError(err?.message || "Unable to load orders. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleCompletePayment = async () => {
    if (!selectedOrder) return;

    try {
      setProcessingPayment(true);
      const response = await fetch(`${API_URL}/api/orders/payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: selectedOrder.id, paymentMethod }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Payment failed.");
      }

      setOrders((prev) => prev.filter((o) => o.id !== selectedOrder.id));
      setIsPaymentModalVisible(false);
      setSelectedOrder(null);
      setSuccessMessage(true);
      setTimeout(() => setSuccessMessage(false), 3000);
    } catch (err: any) {
      setError(err?.message || "Payment could not be completed.");
    } finally {
      setProcessingPayment(false);
    }
  };

  const getOrderLocation = (order: CashierOrder) => {
    if (order.orderType === "dine-in") {
      return order.tableNumber ? `Table ${order.tableNumber.replace(/^Table\s+/i, "")}` : "Dine-in";
    }
    return order.orderType === "takeaway" ? "Takeaway" : "Delivery";
  };

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0B3C29" />
      <Header count={orders.length} />

      {successMessage && (
        <View style={styles.successBanner}>
          <CheckCircle color="#FFF" size={18} style={{ marginRight: 8 }} />
          <Text style={styles.successText}>Payment received successfully!</Text>
        </View>
      )}

      {error !== "" && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchOrders} style={styles.retryButton}>
            <RefreshCw color="#FFF" size={15} />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FF7A00" />}
      >
        <Text style={styles.sectionTitle}>Orders Awaiting Payment</Text>

        {orders.length === 0 ? (
          <View style={styles.centerContainer}>
            <DollarSign color="#CCC" size={60} />
            <Text style={styles.emptyText}>All bills are settled!</Text>
            <Text style={styles.emptySubText}>No unpaid orders are waiting for checkout.</Text>
          </View>
        ) : (
          orders.map((order) => (
            <View key={order.id} style={styles.billCard}>
              <View style={styles.billTopRow}>
                <View style={styles.orderIdGroup}>
                  <Text style={styles.orderIdText}>#{order.orderNumber}</Text>
                  <View style={styles.divider} />
                  <Text style={styles.tableText}>{getOrderLocation(order)}</Text>
                </View>
                <Text style={styles.totalAmountText}>৳{order.totalAmount.toFixed(2)}</Text>
              </View>

              <Text style={styles.waiterInfo}>
                Served by: <Text style={styles.waiterName}>{order.staff?.name || "Unassigned"}</Text>
              </Text>

              {order.customer?.name && order.customer.name !== "Walk-in Customer" && (
                <Text style={styles.customerInfo}>Customer: {order.customer.name}</Text>
              )}

              <View style={styles.itemListPreview}>
                {order.items.map((item) => (
                  <View key={item.id} style={styles.itemPreviewRow}>
                    <Text style={styles.itemPreviewText} numberOfLines={1}>
                      • {item.quantity}x {item.name}
                    </Text>
                    <Text style={styles.itemPrice}>৳{(item.price * item.quantity).toFixed(2)}</Text>
                  </View>
                ))}
              </View>

              {order.discount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Discount</Text>
                  <Text style={styles.discountText}>-৳{order.discount.toFixed(2)}</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.checkoutButton}
                onPress={() => {
                  setSelectedOrder(order);
                  setPaymentMethod("cash");
                  setIsPaymentModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <DollarSign color="#FFF" size={18} style={{ marginRight: 4 }} />
                <Text style={styles.checkoutButtonText}>Proceed to Cash Checkout</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* CHECKOUT MODAL */}
      <Modal visible={isPaymentModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Checkout Bill - #{selectedOrder?.orderNumber}</Text>
              <TouchableOpacity onPress={() => setIsPaymentModalVisible(false)} disabled={processingPayment}>
                <X color="#333" size={24} />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalSubtitle}>
                  {getOrderLocation(selectedOrder)} | Waiter: {selectedOrder.staff?.name || "Unassigned"}
                </Text>

                <View style={styles.receiptBox}>
                  {selectedOrder.items.map((item) => (
                    <View key={item.id} style={styles.receiptLine}>
                      <Text style={styles.receiptItemName}>{item.quantity}x {item.name}</Text>
                      <Text style={styles.receiptItemPrice}>৳{(item.price * item.quantity).toFixed(2)}</Text>
                    </View>
                  ))}

                  <View style={styles.receiptDivider} />

                  <ReceiptRow label="Subtotal" value={`৳${selectedOrder.subtotal.toFixed(2)}`} />
                  {selectedOrder.tax > 0 && <ReceiptRow label="VAT / Tax" value={`৳${selectedOrder.tax.toFixed(2)}`} />}
                  {selectedOrder.discount > 0 && (
                    <View style={styles.receiptSubRow}>
                      <Text style={styles.receiptLabel}>Discount</Text>
                      <Text style={styles.discountText}>-৳{selectedOrder.discount.toFixed(2)}</Text>
                    </View>
                  )}

                  <View style={[styles.receiptSubRow, styles.finalRow]}>
                    <Text style={styles.finalLabel}>Total Payable</Text>
                    <Text style={styles.finalVal}>৳{selectedOrder.totalAmount.toFixed(2)}</Text>
                  </View>
                </View>

                <Text style={styles.paymentMethodTitle}>Select Payment Mode</Text>
                <View style={styles.paymentMethodsRow}>
                  {(["cash", "card", "mobile-banking"] as PaymentMethod[]).map((method) => {
                    const active = paymentMethod === method;
                    return (
                      <TouchableOpacity
                        key={method}
                        style={[styles.methodCard, active && styles.methodCardActive]}
                        onPress={() => setPaymentMethod(method)}
                        disabled={processingPayment}
                      >
                        {method === "cash" && <Banknote color={active ? "#FF7A00" : "#666"} size={20} />}
                        {method === "card" && <CreditCard color={active ? "#FF7A00" : "#666"} size={20} />}
                        {method === "mobile-banking" && <Smartphone color={active ? "#FF7A00" : "#666"} size={20} />}
                        <Text style={[styles.methodText, active && styles.methodTextActive]}>
                          {method === "mobile-banking" ? "Mobile Banking" : method.charAt(0).toUpperCase() + method.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity
                  style={[styles.completePaymentBtn, processingPayment && styles.disabledButton]}
                  onPress={handleCompletePayment}
                  disabled={processingPayment}
                >
                  {processingPayment ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <CheckCircle color="#FFF" size={20} style={{ marginRight: 8 }} />
                      <Text style={styles.completePaymentText}>Collect Payment & Close Order</Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Small helper components to clean up render tree
const Header = ({ count }: { count: number }) => (
  <View style={styles.header}>
    <View style={styles.headerLeft}>
      <Receipt color="#FFF" size={24} style={{ marginRight: 10 }} />
      <View>
        <Text style={styles.headerTitle}>Cashier Counter / POS</Text>
        <Text style={styles.headerSubtitle}>Pending Billings & Checkout</Text>
      </View>
    </View>
    <View style={styles.counterBadge}>
      <Text style={styles.counterBadgeText}>{count} Bills</Text>
    </View>
  </View>
);

const ReceiptRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.receiptSubRow}>
    <Text style={styles.receiptLabel}>{label}</Text>
    <Text style={styles.receiptVal}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0B3C29" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#0B3C29" },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#FFF" },
  headerSubtitle: { fontSize: 11, color: "#D1D5DB" },
  counterBadge: { backgroundColor: "#FF7A00", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16 },
  counterBadgeText: { color: "#FFF", fontSize: 12, fontWeight: "bold" },
  successBanner: { backgroundColor: "#10B981", flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8 },
  successText: { color: "#FFF", fontWeight: "bold", fontSize: 13 },
  errorBanner: { backgroundColor: "#EF4444", padding: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  errorText: { color: "#FFF", flex: 1, fontSize: 13 },
  retryButton: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0,0,0,0.2)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  retryText: { color: "#FFF", marginLeft: 4, fontSize: 12 },
  scrollContainer: { backgroundColor: "#F8F9FA", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, minHeight: "100%" },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#111", marginBottom: 14 },
  centerContainer: { alignItems: "center", justifyContent: "center", marginTop: 80 },
  loadingText: { color: "#666", marginTop: 10 },
  emptyText: { fontSize: 15, color: "#888", marginTop: 10, textAlign: "center" },
  emptySubText: { fontSize: 13, color: "#AAA", marginTop: 4, textAlign: "center" },
  billCard: { backgroundColor: "#FFF", borderRadius: 18, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#E5E7EB", elevation: 2 },
  billTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  orderIdGroup: { flexDirection: "row", alignItems: "center" },
  orderIdText: { fontSize: 18, fontWeight: "bold", color: "#111" },
  divider: { width: 1, height: 14, backgroundColor: "#D1D5DB", marginHorizontal: 10 },
  tableText: { fontSize: 16, fontWeight: "bold", color: "#0B3C29" },
  totalAmountText: { fontSize: 20, fontWeight: "bold", color: "#FF7A00" },
  waiterInfo: { fontSize: 12, color: "#6B7280", marginBottom: 4 },
  waiterName: { fontWeight: "600", color: "#333" },
  customerInfo: { fontSize: 12, color: "#6B7280", marginBottom: 10 },
  itemListPreview: { backgroundColor: "#F9FAFB", borderRadius: 10, padding: 10, marginBottom: 14 },
  itemPreviewRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 2 },
  itemPreviewText: { fontSize: 13, color: "#4B5563", flex: 1 },
  itemPrice: { fontSize: 13, fontWeight: "600", color: "#333" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  summaryLabel: { fontSize: 13, color: "#666" },
  discountText: { fontSize: 13, fontWeight: "600", color: "#10B981" },
  checkoutButton: { backgroundColor: "#0B3C29", flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 12, borderRadius: 12 },
  checkoutButtonText: { color: "#FFF", fontSize: 15, fontWeight: "bold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#FFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: "85%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#111" },
  modalSubtitle: { fontSize: 13, color: "#666", marginBottom: 14 },
  receiptBox: { backgroundColor: "#F8F9FA", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#EFEFEF", marginBottom: 16 },
  receiptLine: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  receiptItemName: { fontSize: 14, color: "#333", flex: 1 },
  receiptItemPrice: { fontSize: 14, fontWeight: "600", color: "#111" },
  receiptDivider: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 10 },
  receiptSubRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  receiptLabel: { fontSize: 13, color: "#666" },
  receiptVal: { fontSize: 13, fontWeight: "500", color: "#333" },
  finalRow: { marginTop: 8, borderTopWidth: 1, borderColor: "#EEE", paddingTop: 8 },
  finalLabel: { fontSize: 16, fontWeight: "bold", color: "#0B3C29" },
  finalVal: { fontSize: 18, fontWeight: "bold", color: "#FF7A00" },
  paymentMethodTitle: { fontSize: 14, fontWeight: "bold", color: "#111", marginBottom: 10 },
  paymentMethodsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  methodCard: { flex: 1, backgroundColor: "#F9FAFB", borderWidth: 1.5, borderColor: "#E5E7EB", borderRadius: 12, paddingVertical: 12, alignItems: "center", marginHorizontal: 4 },
  methodCardActive: { borderColor: "#FF7A00", backgroundColor: "#FFFBF5" },
  methodText: { fontSize: 12, fontWeight: "600", color: "#666", marginTop: 6 },
  methodTextActive: { color: "#FF7A00" },
  completePaymentBtn: { backgroundColor: "#FF7A00", flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 14, borderRadius: 14, marginBottom: 10 },
  completePaymentText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  disabledButton: { opacity: 0.6 },
});