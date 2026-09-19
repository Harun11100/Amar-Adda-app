import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  XCircle,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig?.extra?.API_URL;

type OrderStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

type OrderItem = {
  food: string;
  name: string;
  quantity: number;
  price: number;
  customizations?: string;
};

type Staff = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
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

  orderType: "dine-in" | "takeaway" | "delivery";

  tableNumber: string | null;

  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;

  orderStatus: OrderStatus;

  paymentStatus: "unpaid" | "paid" | "refunded";

  paymentMethod:
    | "cash"
    | "card"
    | "mobile-banking"
    | "online"
    | "due";

  staff?: Staff | string | null;

  notes: string;

  createdAt: string;
  updatedAt: string;
};

const filterTabs: {
  label: string;
  value: "all" | OrderStatus;
}[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Preparing", value: "preparing" },
  { label: "Ready", value: "ready" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

const formatOrderTime = (dateString: string) => {
  if (!dateString) return "";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
};

const getStatusLabel = (status: OrderStatus) => {
  switch (status) {
    case "pending":
      return "Pending";

    case "preparing":
      return "Preparing";

    case "ready":
      return "Ready";

    case "completed":
      return "Completed";

    case "cancelled":
      return "Cancelled";

    default:
      return status;
  }
};

const getNextStatus = (
  currentStatus: OrderStatus
): OrderStatus | null => {
  switch (currentStatus) {
    case "pending":
      return "preparing";

    case "preparing":
      return "ready";

    case "ready":
      return "completed";

    default:
      return null;
  }
};

const getNextActionLabel = (
  currentStatus: OrderStatus
) => {
  switch (currentStatus) {
    case "pending":
      return "Start Preparing";

    case "preparing":
      return "Mark as Ready";

    case "ready":
      return "Mark Completed";

    default:
      return "";
  }
};

export default function KitchenScreen() {
  const [orders, setOrders] = useState<Order[]>([]);

  const [selectedFilter, setSelectedFilter] =
    useState<"all" | OrderStatus>("all");

  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [updatingOrderId, setUpdatingOrderId] =
    useState<string | null>(null);

  /**
   * Fetch orders from API
   */
  const fetchOrders = useCallback(
    async (refresh = false) => {
      try {
        if (refresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        const response = await fetch(
          `${API_URL}/api/orders`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Failed to fetch orders."
          );
        }

        setOrders(data.orders || []);
      } catch (error: any) {
        console.error(
          "Fetch kitchen orders error:",
          error
        );

        Alert.alert(
          "Unable to load orders",
          error?.message ||
            "Something went wrong while loading orders."
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  /**
   * Update order status
   */
  const handleUpdateStatus = async (
    orderId: string,
    currentStatus: OrderStatus
  ) => {
    const nextStatus =
      getNextStatus(currentStatus);

    if (!nextStatus) {
      return;
    }

    try {
      setUpdatingOrderId(orderId);

      const response = await fetch(
        `${API_URL}/api/orders`,
        {
          method: "PATCH",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId,
            orderStatus: nextStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to update order status."
        );
      }

      /**
       * Update local state immediately
       */
      setOrders((previousOrders) =>
        previousOrders.map((order) =>
          order._id === orderId
            ? {
                ...order,
                orderStatus: nextStatus,
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

  /**
   * Filter orders
   */
  const filteredOrders = useMemo(() => {
    if (selectedFilter === "all") {
      return orders;
    }

    return orders.filter(
      (order) =>
        order.orderStatus === selectedFilter
    );
  }, [orders, selectedFilter]);

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
            style={{ marginRight: 10 }}
          />

          <View>
            <Text style={styles.headerTitle}>
              Kitchen Display System
            </Text>

            <Text
              style={styles.headerSubtitle}
            >
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

      {/* FILTER */}
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.filterScroll
          }
        >
          {filterTabs.map((tab) => {
            const isSelected =
              selectedFilter === tab.value;

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
                  setSelectedFilter(
                    tab.value
                  )
                }
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
            style={styles.refreshButton}
            onPress={() =>
              fetchOrders(true)
            }
            disabled={isRefreshing}
          >
            <RefreshCw
              color="#FFFFFF"
              size={16}
            />
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ORDERS */}
      <ScrollView
        contentContainerStyle={
          styles.scrollContainer
        }
        showsVerticalScrollIndicator={false}
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
          </View>
        ) : (
          filteredOrders.map((order) => {
            let statusBg = "#E5E7EB";
            let statusColor = "#374151";

            if (
              order.orderStatus ===
              "pending"
            ) {
              statusBg = "#FFE8D6";
              statusColor = "#FF7A00";
            } else if (
              order.orderStatus ===
              "preparing"
            ) {
              statusBg = "#D6E4FD";
              statusColor = "#2563EB";
            } else if (
              order.orderStatus === "ready"
            ) {
              statusBg = "#D1EAD8";
              statusColor = "#0B3C29";
            } else if (
              order.orderStatus ===
              "completed"
            ) {
              statusBg = "#E0F2FE";
              statusColor = "#0369A1";
            } else if (
              order.orderStatus ===
              "cancelled"
            ) {
              statusBg = "#FEE2E2";
              statusColor = "#DC2626";
            }

            const nextActionLabel =
              getNextActionLabel(
                order.orderStatus
              );

            const staffName =
              typeof order.staff ===
              "object"
                ? order.staff?.name
                : undefined;

            const isUpdating =
              updatingOrderId ===
              order._id;

            return (
              <View
                key={order._id}
                style={styles.orderCard}
              >
                {/* ORDER HEADER */}
                <View
                  style={
                    styles.cardHeaderRow
                  }
                >
                  <View
                    style={
                      styles.orderIdGroup
                    }
                  >
                    <Text
                      style={
                        styles.orderIdText
                      }
                    >
                      #{order.orderNumber}
                    </Text>

                    <View
                      style={styles.divider}
                    />

                    <Text
                      style={
                        styles.tableText
                      }
                    >
                      {order.orderType ===
                      "dine-in"
                        ? order.tableNumber ||
                          "No Table"
                        : order.orderType ===
                          "takeaway"
                        ? "Takeaway"
                        : "Delivery"}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          statusBg,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            statusColor,
                        },
                      ]}
                    >
                      {getStatusLabel(
                        order.orderStatus
                      )}
                    </Text>
                  </View>
                </View>

                {/* ORDER META */}
                <View style={styles.metaRow}>
                  <Text
                    style={styles.waiterText}
                  >
                    Waiter:{" "}
                    <Text
                      style={{
                        fontWeight:
                          "bold",
                      }}
                    >
                      {staffName ||
                        "Unknown"}
                    </Text>
                  </Text>

                  <View
                    style={
                      styles.timeGroup
                    }
                  >
                    <Clock
                      color="#777"
                      size={13}
                      style={{
                        marginRight: 4,
                      }}
                    />

                    <Text
                      style={
                        styles.timeText
                      }
                    >
                      {formatOrderTime(
                        order.createdAt
                      )}
                    </Text>
                  </View>
                </View>

                {/* CUSTOMER */}
                {order.customer?.name &&
                  order.customer.name !==
                    "Walk-in Customer" && (
                    <View
                      style={
                        styles.customerRow
                      }
                    >
                      <Text
                        style={
                          styles.customerLabel
                        }
                      >
                        Customer
                      </Text>

                      <Text
                        style={
                          styles.customerName
                        }
                      >
                        {order.customer.name}
                      </Text>
                    </View>
                  )}

                {/* ITEMS */}
                <View
                  style={
                    styles.itemsListContainer
                  }
                >
                  <Text
                    style={
                      styles.itemSectionTitle
                    }
                  >
                    Items Ordered:
                  </Text>

                  {order.items.map(
                    (item, index) => (
                      <View
                        key={`${order._id}-${index}`}
                        style={
                          styles.itemRow
                        }
                      >
                        <Text
                          style={
                            styles.itemQuantityBullet
                          }
                        >
                          {item.quantity}x
                        </Text>

                        <View
                          style={
                            styles.itemNameContainer
                          }
                        >
                          <Text
                            style={
                              styles.itemNameText
                            }
                          >
                            {item.name}
                          </Text>

                          {item.customizations ? (
                            <Text
                              style={
                                styles.customizationText
                              }
                            >
                              {item.customizations}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    )
                  )}
                </View>

                {/* NOTES */}
                {order.notes?.trim() ? (
                  <View
                    style={styles.notesBox}
                  >
                    <AlertCircle
                      color="#FF7A00"
                      size={15}
                    />

                    <Text
                      style={styles.notesText}
                    >
                      {order.notes}
                    </Text>
                  </View>
                ) : null}

                {/* ACTION */}
                {order.orderStatus ===
                "cancelled" ? (
                  <View
                    style={
                      styles.cancelledBanner
                    }
                  >
                    <XCircle
                      color="#DC2626"
                      size={17}
                      style={{
                        marginRight: 6,
                      }}
                    />

                    <Text
                      style={
                        styles.cancelledText
                      }
                    >
                      Order Cancelled
                    </Text>
                  </View>
                ) : order.orderStatus ===
                  "completed" ? (
                  <View
                    style={
                      styles.completedBanner
                    }
                  >
                    <CheckCircle2
                      color="#0369A1"
                      size={16}
                      style={{
                        marginRight: 6,
                      }}
                    />

                    <Text
                      style={
                        styles.completedText
                      }
                    >
                      Order Completed
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      isUpdating &&
                        styles.actionButtonDisabled,
                    ]}
                    disabled={isUpdating}
                    onPress={() =>
                      handleUpdateStatus(
                        order._id,
                        order.orderStatus
                      )
                    }
                  >
                    {isUpdating ? (
                      <ActivityIndicator
                        color="#FFFFFF"
                        size="small"
                      />
                    ) : (
                      <>
                        <Text
                          style={
                            styles.actionButtonText
                          }
                        >
                          {nextActionLabel}
                        </Text>

                        <ArrowRight
                          color="#FFF"
                          size={16}
                          style={{
                            marginLeft: 6,
                          }}
                        />
                      </>
                    )}
                  </TouchableOpacity>
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
    backgroundColor:
      "rgba(239, 68, 68, 0.2)",
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
    backgroundColor:
      "rgba(255,255,255,0.1)",
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
    backgroundColor:
      "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
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
  },

  orderCard: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
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

  tableText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#0B3C29",
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
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
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
  },

  customerLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "600",
    marginRight: 8,
  },

  customerName: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "700",
  },

  itemsListContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },

  itemSectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#6B7280",
    marginBottom: 6,
  },

  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 4,
  },

  itemQuantityBullet: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FF7A00",
    marginRight: 8,
    width: 28,
  },

  itemNameContainer: {
    flex: 1,
  },

  itemNameText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },

  customizationText: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
    fontStyle: "italic",
  },

  notesBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },

  notesText: {
    flex: 1,
    fontSize: 12,
    color: "#9A3412",
    marginLeft: 7,
    lineHeight: 17,
  },

  actionButton: {
    backgroundColor: "#0B3C29",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
  },

  actionButtonDisabled: {
    opacity: 0.65,
  },

  actionButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "bold",
  },

  completedBanner: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E0F2FE",
    paddingVertical: 10,
    borderRadius: 12,
  },

  completedText: {
    color: "#0369A1",
    fontWeight: "bold",
    fontSize: 14,
  },

  cancelledBanner: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    paddingVertical: 10,
    borderRadius: 12,
  },

  cancelledText: {
    color: "#DC2626",
    fontWeight: "bold",
    fontSize: 14,
  },
});