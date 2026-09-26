import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  XCircle,
  Trash2,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";

// Import your global auth store
import { useAuthStore } from "../../../store/authStore"; // Adjust path as needed

const API_URL = Constants.expoConfig?.extra?.API_URL;

// ============================================================
// TYPES
// ============================================================

type OrderStatus =
  | "pending"
  | "preparing"
  | "completed"
  | "cancelled";

type OrderVariant = {
  id?: string | null;
  name?: string | null;
  price?: number | null;
};

type OrderItem = {
  food: string | null;
  name: string;
  quantity: number;
  price: number;
  variant?: OrderVariant | null;
  customizations?: string;
};

type Order = {
  _id: string;
  orderNumber: string;

  customer: {
    name: string;
    phone: string;
    address: string;
  };

  items: OrderItem[];

  orderType:
    | "dine-in"
    | "takeaway"
    | "delivery";

  tableNumber: string | null;

  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;

  orderStatus: OrderStatus;

  paymentStatus:
    | "unpaid"
    | "paid"
    | "refunded";

  paymentMethod:
    | "cash"
    | "card"
    | "mobile-banking"
    | "online"
    | "due";

  staffName?: string;
  staff?: string | null;
  notes: string;

  createdAt: string;
  updatedAt: string;
};

// ============================================================
// FILTER TABS
// ============================================================

const filterTabs: {
  label: string;
  value: "pending" | OrderStatus;
}[] = [
  {
    label: "Pending",
    value: "pending",
  },
  {
    label: "Preparing",
    value: "preparing",
  },
  {
    label: "Cancelled",
    value: "cancelled",
  },
];

// ============================================================
// FORMAT ORDER TIME
// ============================================================

const formatOrderTime = (dateString: string) => {
  if (!dateString) {
    return "";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
};

// ============================================================
// STATUS LABEL
// ============================================================

const getStatusLabel = (status: OrderStatus) => {
  switch (status) {
    case "pending":
      return "Pending";
    case "preparing":
      return "Preparing";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
};

// ============================================================
// NEXT STATUS
// ============================================================

const getNextStatus = (
  currentStatus: OrderStatus
): OrderStatus | null => {
  switch (currentStatus) {
    case "pending":
      return "preparing";
    case "preparing":
      return "completed";
    default:
      return null;
  }
};

// ============================================================
// NEXT ACTION LABEL
// ============================================================

const getNextActionLabel = (currentStatus: OrderStatus) => {
  switch (currentStatus) {
    case "pending":
      return "Start Preparing";
    case "preparing":
      return "Mark Completed";
    default:
      return "";
  }
};

// ============================================================
// KITCHEN SCREEN
// ============================================================

export default function KitchenScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<"pending" | OrderStatus>("pending");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Retrieve user role dynamically from authStore
  const userRole = useAuthStore((state: any) => state.userRole || state.user?.role);

  // ==========================================================
  // FETCH ORDERS
  // ==========================================================

  const fetchOrders = useCallback(
    async (refresh = false) => {
      if (!API_URL) {
        setIsLoading(false);
        setIsRefreshing(false);

        Alert.alert(
          "Configuration Error",
          "API URL is not configured."
        );

        return;
      }

      if (refresh) {
        setIsRefreshing(true);
      } else {
        if (orders.length === 0) {
          setIsLoading(true);
        }
      }

      try {
        const response = await fetch(
          `${API_URL}/api/admin/order/getOrder`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
          }
        );

        let data: any;

        try {
          data = await response.json();
        } catch {
          throw new Error(
            "Server returned an invalid response."
          );
        }

        if (
          !response.ok ||
          !data?.success
        ) {
          throw new Error(
            data?.message ||
              "Failed to fetch orders."
          );
        }

        setOrders(
          Array.isArray(data.orders)
            ? data.orders
            : []
        );
      } catch (error: any) {
        console.error(
          "Fetch kitchen orders error:",
          error
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [orders.length]
  );

  // ==========================================================
  // INITIAL LOAD & AUTO-REFRESH (Every 10 seconds)
  // ==========================================================

  useEffect(() => {
    fetchOrders();

    const intervalId = setInterval(() => {
      fetchOrders(true);
    }, 10000);

    return () => clearInterval(intervalId);
  }, [fetchOrders]);

  // ==========================================================
  // MANUAL REFRESH
  // ==========================================================

  const handleRefresh = useCallback(() => {
    if (isRefreshing) {
      return;
    }

    fetchOrders(true);
  }, [fetchOrders, isRefreshing]);

  // ==========================================================
  // UPDATE ORDER STATUS (WITH ROLE CHECK)
  // ==========================================================

  const handleUpdateStatus = async (
    orderId: string,
    targetStatus: OrderStatus
  ) => {
    const normalizedRole = typeof userRole === "string" ? userRole.toLowerCase() : "";
    if (normalizedRole !== "chef" && normalizedRole !== "admin") {
      Alert.alert(
        "Access Denied",
        "Only chefs and administrators are authorized to update order statuses from the kitchen screen."
      );
      return;
    }

    if (!API_URL) {
      Alert.alert(
        "Configuration Error",
        "API URL is not configured."
      );

      return;
    }

    try {
      setUpdatingOrderId(orderId);

      const response = await fetch(
        `${API_URL}/api/admin/order/updateOrderStatus`,
        {
          method: "PATCH",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId,
            orderStatus: targetStatus,
          }),
        }
      );

      let data: any;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "Server returned an invalid response."
        );
      }

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.message ||
            "Failed to update order status."
        );
      }

      // Update locally
      setOrders(
        (previousOrders) =>
          previousOrders.map((order) =>
            order._id === orderId
              ? {
                  ...order,
                  orderStatus: targetStatus,
                }
              : order
          )
      );
    } catch (error: any) {
      console.error(
        "Update order status error:",
        error
      );

      Alert.alert(
        "Update failed",
        error?.message ||
          "Unable to update order status."
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // ==========================================================
  // HANDLE CANCEL ORDER CONFIRMATION
  // ==========================================================

  const handleCancelOrder = (orderId: string) => {
    Alert.alert(
      "Cancel Order",
      "Are you sure you want to cancel this pending order?",
      [
        {
          text: "No",
          style: "cancel",
        },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: () => handleUpdateStatus(orderId, "cancelled"),
        },
      ]
    );
  };

  // ==========================================================
  // HANDLE DELETE CANCELLED ORDER (ADMIN ONLY)
  // ==========================================================

  const handleDeleteOrder = (orderId: string) => {
    // Check if the user role is strictly 'admin'
    const normalizedRole = typeof userRole === "string" ? userRole.toLowerCase() : "";
    if (normalizedRole !== "admin") {
      Alert.alert(
        "Access Denied",
        "Only administrators are authorized to delete cancelled orders."
      );
      return;
    }

    Alert.alert(
      "Delete Order",
      "Are you sure you want to permanently delete this cancelled order?",
      [
        {
          text: "No",
          style: "cancel",
        },
        {
          text: "Yes, Delete",
          style: "destructive",
          onPress: async () => {
            if (!API_URL) {
              Alert.alert("Configuration Error", "API URL is not configured.");
              return;
            }

            try {
              setUpdatingOrderId(orderId);

              const response = await fetch(
                `${API_URL}/api/admin/order/cancelOrder`,
                {
                  method: "DELETE",
                  headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ orderId }),
                }
              );

              let data: any;
              try {
                data = await response.json();
              } catch {
                throw new Error("Server returned an invalid response.");
              }

              if (!response.ok || !data?.success) {
                throw new Error(data?.message || "Failed to delete order.");
              }

              // Remove order locally from state
              setOrders((prevOrders) => prevOrders.filter((o) => o._id !== orderId));
            } catch (error: any) {
              console.error("Delete order error:", error);
              Alert.alert("Delete failed", error?.message || "Unable to delete order.");
            } finally {
              setUpdatingOrderId(null);
            }
          },
        },
      ]
    );
  };

  // ==========================================================
  // FILTER ORDERS
  // ==========================================================

  const filteredOrders = useMemo(() => {
    if (selectedFilter === "all") {
      return orders;
    }

    return orders.filter(
      (order) =>
        order.orderStatus ===
        selectedFilter
    );
  }, [orders, selectedFilter]);

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0B3C29"
      />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ChefHat
            color="#FFF"
            size={26}
            style={{
              marginRight: 10,
            }}
          />

          <View>
            <Text style={styles.headerTitle}>
              Kitchen Display System
            </Text>

            <Text style={styles.headerSubtitle}>
              Live Order Queue & Preparation
            </Text>
          </View>
        </View>

        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>
            LIVE
          </Text>
        </View>
      </View>

      {/* FILTER + REFRESH */}
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {filterTabs.map((tab) => {
            const isSelected = selectedFilter === tab.value;

            return (
              <TouchableOpacity
                key={tab.value}
                style={[
                  styles.filterTab,
                  isSelected
                    ? styles.filterTabActive
                    : styles.filterTabInactive,
                ]}
                onPress={() =>
                  setSelectedFilter(tab.value)
                }
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterText,
                    isSelected
                      ? styles.filterTextActive
                      : styles.filterTextInactive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={[
              styles.refreshButton,
              isRefreshing &&
                styles.refreshButtonDisabled,
            ]}
            onPress={handleRefresh}
            disabled={isRefreshing}
            activeOpacity={0.8}
          >
            {isRefreshing ? (
              <ActivityIndicator
                color="#FFFFFF"
                size="small"
              />
            ) : (
              <RefreshCw
                color="#FFFFFF"
                size={16}
              />
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ORDERS */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#FF7A00"
            colors={["#FF7A00"]}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color="#FF7A00"
            />
            <Text style={styles.loadingText}>
              Loading kitchen orders...
            </Text>
          </View>
        ) : filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ChefHat
              color="#CCC"
              size={54}
            />
            <Text style={styles.emptyText}>
              No orders found in this queue
            </Text>

            <TouchableOpacity
              style={styles.emptyRefreshButton}
              onPress={handleRefresh}
              disabled={isRefreshing}
              activeOpacity={0.8}
            >
              {isRefreshing ? (
                <ActivityIndicator
                  color="#0B3C29"
                  size="small"
                />
              ) : (
                <RefreshCw
                  color="#0B3C29"
                  size={16}
                />
              )}
              <Text style={styles.emptyRefreshText}>
                Refresh Orders
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredOrders.map((order) => {
            let statusBg = "#E5E7EB";
            let statusColor = "#374151";

            if (order.orderStatus === "pending") {
              statusBg = "#FFE8D6";
              statusColor = "#FF7A00";
            } else if (order.orderStatus === "preparing") {
              statusBg = "#D6E4FD";
              statusColor = "#2563EB";
            } else if (order.orderStatus === "completed") {
              statusBg = "#E0F2FE";
              statusColor = "#0369A1";
            } else if (order.orderStatus === "cancelled") {
              statusBg = "#FEE2E2";
              statusColor = "#DC2626";
            }

            const nextStatus = getNextStatus(order.orderStatus);
            const nextActionLabel = getNextActionLabel(order.orderStatus);
            const staffName = order.staffName || "Unknown";
            const isUpdating = updatingOrderId === order._id;

            return (
              <View key={order._id} style={styles.orderCard}>
                {/* ORDER HEADER */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.orderIdGroup}>
                    <Text style={styles.orderIdText}>
                      Table: {order.tableNumber}
                    </Text>
                    <View style={styles.divider} />
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusBg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: statusColor },
                      ]}
                    >
                      {getStatusLabel(order.orderStatus)}
                    </Text>
                  </View>
                </View>

                {/* ORDER META */}
                <View style={styles.metaRow}>
                  <Text style={styles.waiterText}>
                    Waiter:{" "}
                    <Text style={{ fontWeight: "bold", color: "#111827" }}>
                      {staffName}
                    </Text>
                  </Text>

                  <View style={styles.timeGroup}>
                    <Clock
                      color="#777"
                      size={13}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.timeText}>
                      {formatOrderTime(order.createdAt)}
                    </Text>
                  </View>
                </View>

                {/* CUSTOMER */}
                {order.customer?.name &&
                  order.customer.name !== "Walk-in Customer" && (
                    <View style={styles.customerRow}>
                      <Text style={styles.customerLabel}>Customer</Text>
                      <Text style={styles.customerName}>
                        {order.customer.name}
                      </Text>
                    </View>
                  )}

                {/* ITEMS */}
                <View style={styles.itemsListContainer}>
                  <Text style={styles.itemSectionTitle}>
                    Items Ordered:
                  </Text>

                  {order.items.map((item, index) => (
                    <View
                      key={`${order._id}-${index}`}
                      style={styles.itemRow}
                    >
                      <Text style={styles.itemQuantityBullet}>
                        {item.quantity}x
                      </Text>

                      <View style={styles.itemNameContainer}>
                        <Text style={styles.itemNameText}>
                          {item.name}
                        </Text>

                        {item.variant?.name ? (
                          <View style={styles.variantRow}>
                            <Text style={styles.variantLabel}>Variant:</Text>
                            <Text style={styles.variantName}>
                              {item.variant.name}
                            </Text>
                          </View>
                        ) : null}

                        {item.customizations ? (
                          <Text style={styles.customizationText}>
                            {item.customizations}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>

                {/* NOTES */}
                {order.notes?.trim() ? (
                  <View style={styles.notesBox}>
                    <AlertCircle color="#FF7A00" size={15} />
                    <Text style={styles.notesText}>{order.notes}</Text>
                  </View>
                ) : null}

                {/* ACTION */}
                {order.orderStatus === "cancelled" ? (
                  <View style={styles.actionRow}>
                    <View style={[styles.cancelledBanner, { flex: 1 }]}>
                      <XCircle color="#DC2626" size={17} style={{ marginRight: 6 }} />
                      <Text style={styles.cancelledText}>Order Cancelled</Text>
                    </View>

                    {/* Delete button (Admin-only access handled in function) */}
                    <TouchableOpacity
                      style={[
                        styles.deleteButton,
                        isUpdating && styles.actionButtonDisabled,
                      ]}
                      disabled={isUpdating}
                      onPress={() => handleDeleteOrder(order._id)}
                      activeOpacity={0.8}
                    >
                      {isUpdating ? (
                        <ActivityIndicator color="#DC2626" size="small" />
                      ) : (
                        <Trash2 color="#DC2626" size={18} />
                      )}
                    </TouchableOpacity>
                  </View>
                ) : order.orderStatus === "completed" ? (
                  <View style={styles.completedBanner}>
                    <CheckCircle2 color="#0369A1" size={16} style={{ marginRight: 6 }} />
                    <Text style={styles.completedText}>Order Completed</Text>
                  </View>
                ) : (
                  <View style={styles.actionRow}>
                    {/* Cancel Button only for pending orders */}
                    {order.orderStatus === "pending" && (
                      <TouchableOpacity
                        style={[
                          styles.cancelButton,
                          isUpdating && styles.actionButtonDisabled,
                        ]}
                        disabled={isUpdating}
                        onPress={() => handleCancelOrder(order._id)}
                        activeOpacity={0.8}
                      >
                        <XCircle color="#DC2626" size={15} style={{ marginRight: 4 }} />
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                    )}

                    {/* Progress Action Button */}
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        order.orderStatus === "pending" ? { flex: 2 } : { flex: 1 },
                        isUpdating && styles.actionButtonDisabled,
                      ]}
                      disabled={isUpdating}
                      onPress={() =>
                        nextStatus && handleUpdateStatus(
                          order._id,
                          nextStatus
                        )
                      }
                      activeOpacity={0.8}
                    >
                      {isUpdating ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <Text style={styles.actionButtonText}>
                            {nextActionLabel}
                          </Text>
                          <ArrowRight
                            color="#FFF"
                            size={16}
                            style={{ marginLeft: 6 }}
                          />
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0B3C29",
  },
  header: {
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
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#D1D5DB",
    marginTop: 2,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    marginRight: 6,
  },
  liveText: {
    color: "#EF4444",
    fontSize: 11,
    fontWeight: "bold",
  },
  filterWrapper: {
    backgroundColor: "#072E20",
    paddingVertical: 8,
  },
  filterScroll: {
    paddingHorizontal: 12,
    alignItems: "center",
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginHorizontal: 4,
  },
  filterTabActive: {
    backgroundColor: "#FF7A00",
  },
  filterTabInactive: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#FFF",
  },
  filterTextInactive: {
    color: "#D1D5DB",
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
  refreshButtonDisabled: {
    opacity: 0.6,
  },
  scrollContainer: {
    backgroundColor: "#F8F9FA",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    minHeight: "100%",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#777",
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
  },
  emptyText: {
    fontSize: 15,
    color: "#888",
    marginTop: 10,
    textAlign: "center",
  },
  emptyRefreshButton: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#0B3C29",
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  emptyRefreshText: {
    color: "#0B3C29",
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 6,
  },
  orderCard: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderIdGroup: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  orderIdText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111",
  },
  divider: {
    width: 1,
    height: 14,
    backgroundColor: "#D1D5DB",
    marginHorizontal: 10,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  waiterText: {
    fontSize: 13,
    color: "#4B5563",
  },
  timeGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    fontSize: 12,
    color: "#6B7280",
  },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: "#F9FAFB",
    padding: 8,
    borderRadius: 8,
  },
  customerLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginRight: 8,
  },
  customerName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937",
  },
  itemsListContainer: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F3F4F6",
    paddingVertical: 10,
    marginBottom: 10,
  },
  itemSectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#4B5563",
    marginBottom: 6,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  itemQuantityBullet: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#FF7A00",
    marginRight: 8,
  },
  itemNameContainer: {
    flex: 1,
  },
  itemNameText: {
    fontSize: 13,
    color: "#1F2937",
    fontWeight: "500",
  },
  variantRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  variantLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginRight: 4,
  },
  variantName: {
    fontSize: 11,
    color: "#374151",
    fontWeight: "500",
  },
  customizationText: {
    fontSize: 11,
    color: "#D97706",
    marginTop: 2,
    fontStyle: "italic",
  },
  notesBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FEF3C7",
  },
  notesText: {
    fontSize: 12,
    color: "#92400E",
    marginLeft: 6,
    flex: 1,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  actionButton: {
    backgroundColor: "#FF7A00",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    flex: 1,
  },
  cancelButton: {
    backgroundColor: "#FEE2E2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    flex: 1,
  },
  cancelButtonText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "bold",
  },
  deleteButton: {
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "bold",
  },
  cancelledBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
    paddingVertical: 10,
    borderRadius: 10,
  },
  cancelledText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "bold",
  },
  completedBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E0F2FE",
    paddingVertical: 10,
    borderRadius: 10,
  },
  completedText: {
    color: "#0369A1",
    fontSize: 13,
    fontWeight: "bold",
  },
});