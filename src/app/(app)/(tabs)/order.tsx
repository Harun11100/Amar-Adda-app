import React, { useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  UtensilsCrossed,
  Plus,
  Minus,
  ShoppingBag,
  CheckCircle,
  X,
  ChevronRight,
  Send,
  Search,
  ClipboardList,
  RefreshCw,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";

const { width } = Dimensions.get("window");

const API_URL = Constants.expoConfig?.extra?.API_URL;

const COLORS = {
  green: "#0B3C29",
  orange: "#FF7A00",
  white: "#FFFFFF",
  background: "#F5F7F6",
  text: "#18211D",
  muted: "#8A938F",
  border: "#E7ECE9",
};

const tablesList = [
  "Table 1",
  "Table 2",
  "Table 3",
  "Table 5",
  "Table 8",
  "Table 12",
  "Takeaway",
];

type Food = {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  discountPrice: number | null;
  effectivePrice?: number;
  image: string;
  isAvailable: boolean;
  isFeatured: boolean;
  spicyLevel: number;
  isVegetarian: boolean;
  preparationTime: number;
  createdAt?: string;
  updatedAt?: string;
};

type CartItem = Food & {
  quantity: number;
};

export default function WaiterOrderFlowScreen() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const [searchQuery, setSearchQuery] = useState("");

  const [cart, setCart] = useState<CartItem[]>([]);

  const [isLoadingFoods, setIsLoadingFoods] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isCartVisible, setIsCartVisible] = useState(false);
  const [isTableModalVisible, setIsTableModalVisible] = useState(false);

  const [selectedTable, setSelectedTable] = useState("Table 12");

  const [orderSentSuccess, setOrderSentSuccess] = useState(false);

  /**
   * Get foods from API
   */
  const fetchFoods = async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoadingFoods(true);
      }

      const response = await fetch(`${API_URL}/api/food-items?available=true`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load food items.");
      }

      setFoods(data.foods || []);
    } catch (error: any) {
      console.error("Fetch foods error:", error);

      Alert.alert(
        "Unable to load menu",
        error?.message || "Something went wrong while loading food items."
      );
    } finally {
      setIsLoadingFoods(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  /**
   * Get unique categories from database
   */
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(foods.map((food) => food.category))
    );

    return ["All", ...uniqueCategories];
  }, [foods]);

  /**
   * Filter foods
   */
  const visibleFoods = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return foods.filter((food) => {
      const matchesCategory =
        selectedCategory === "All" || food.category === selectedCategory;

      const matchesSearch =
        !query ||
        food.name.toLowerCase().includes(query) ||
        food.description.toLowerCase().includes(query) ||
        food.category.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [foods, selectedCategory, searchQuery]);

  /**
   * Get actual selling price
   */
  const getFoodPrice = (food: Food) => {
    if (food.effectivePrice !== undefined && food.effectivePrice !== null) {
      return food.effectivePrice;
    }

    if (food.discountPrice !== null && food.discountPrice !== undefined) {
      return food.discountPrice;
    }

    return food.price;
  };

  /**
   * Add food to cart
   */
  const handleAddToCart = (food: Food) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => item._id === food._id
      );

      if (existingIndex > -1) {
        const updated = [...prevCart];

        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
        };

        return updated;
      }

      return [
        ...prevCart,
        {
          ...food,
          quantity: 1,
        },
      ];
    });
  };

  /**
   * Update quantity
   */
  const updateQuantity = (foodId: string, delta: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item._id === foodId) {
            return {
              ...item,
              quantity: item.quantity + delta,
            };
          }

          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  /**
   * Cart totals
   */
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = cart.reduce(
    (sum, item) => sum + getFoodPrice(item) * item.quantity,
    0
  );

  const tax = 0;
  const discount = 0;
  const totalAmount = subtotal + tax - discount;

  /**
   * Send order
   */
  const handleSendToKitchen = async () => {
    if (cart.length === 0) {
      Alert.alert("Empty order", "Please add at least one food item.");
      return;
    }

    if (!selectedTable) {
      Alert.alert(
        "Select table",
        "Please select a table before sending the order."
      );
      return;
    }

    try {
      const orderType = selectedTable === "Takeaway" ? "takeaway" : "dine-in";

      const orderPayload = {
        customer: {
          name: "Walk-in Customer",
          phone: "",
          address: "",
        },

        items: cart.map((item) => ({
          food: item._id,
          name: item.name,
          quantity: item.quantity,
          price: getFoodPrice(item),
          customizations: "",
        })),

        orderType,
        tableNumber: orderType === "dine-in" ? selectedTable : null,
        subtotal,
        tax,
        discount,
        totalAmount,
        orderStatus: "pending",
        paymentStatus: "unpaid",
        paymentMethod: "cash",
        notes: "",
      };

      console.log("ORDER PAYLOAD:", JSON.stringify(orderPayload, null, 2));

      setIsTableModalVisible(false);
      setIsCartVisible(false);
      setOrderSentSuccess(true);
      setCart([]);

      setTimeout(() => {
        setOrderSentSuccess(false);
      }, 3000);
    } catch (error: any) {
      console.error("Send order error:", error);

      Alert.alert(
        "Order failed",
        error?.message || "Unable to send order to kitchen."
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.green} />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.brandRow}>
            <View style={styles.logoBox}>
              <UtensilsCrossed color="#FFFFFF" size={19} />
            </View>

            <View>
              <Text style={styles.headerEyebrow}>RESTAURANT POS</Text>
              <Text style={styles.headerTitle}>Staff Order Terminal</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.headerCart}
            onPress={() => setIsCartVisible(true)}
          >
            <ShoppingBag color="#FFFFFF" size={21} />

            {totalItemsCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{totalItemsCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.tableStatus}>
          <View style={styles.liveDot} />

          <Text style={styles.tableStatusLabel}>Ordering for</Text>

          <TouchableOpacity
            onPress={() => setIsTableModalVisible(true)}
            style={styles.tableStatusPill}
          >
            <Text style={styles.tableStatusText}>{selectedTable}</Text>
            <ChevronRight color={COLORS.green} size={14} />
          </TouchableOpacity>
        </View>
      </View>

      {/* SUCCESS */}
      {orderSentSuccess && (
        <View style={styles.successBanner}>
          <CheckCircle color="#FFFFFF" size={19} />
          <Text style={styles.successText}>
            Order sent to kitchen successfully
          </Text>
        </View>
      )}

      {/* SEARCH */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Search color="#8A938F" size={19} />

          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search menu items..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            returnKeyType="search"
          />

          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X color="#9CA3AF" size={18} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* CATEGORIES */}
      {!isLoadingFoods && foods.length > 0 && (
        <View style={styles.categoryArea}>
          <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabel}>Categories</Text>

            <TouchableOpacity
              onPress={() => fetchFoods(true)}
              disabled={isRefreshing}
            >
              <RefreshCw color={COLORS.muted} size={15} />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catScroll}
          >
            {categories.map((category) => {
              const isSelected = selectedCategory === category;

              return (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.catTab,
                    isSelected ? styles.catTabActive : styles.catTabInactive,
                  ]}
                  onPress={() => {
                    setSelectedCategory(category);
                  }}
                >
                  <Text
                    style={[
                      styles.catText,
                      isSelected
                        ? styles.catTextActive
                        : styles.catTextInactive,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* MENU */}
      <ScrollView
        contentContainerStyle={[
          styles.itemsContainer,
          totalItemsCount > 0 && {
            paddingBottom: 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isLoadingFoods ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={COLORS.orange} />
            <Text style={styles.loadingText}>Loading menu...</Text>
          </View>
        ) : (
          <>
            <View style={styles.menuHeadingRow}>
              <View>
                <Text style={styles.sectionHeaderTitle}>
                  {selectedCategory === "All" ? "All Menu" : selectedCategory}
                </Text>

                <Text style={styles.menuSubtitle}>
                  {visibleFoods.length}{" "}
                  {visibleFoods.length === 1 ? "menu item" : "menu items"}{" "}
                  available
                </Text>
              </View>

              <View style={styles.categoryIcon}>
                <UtensilsCrossed color={COLORS.green} size={17} />
              </View>
            </View>

            {visibleFoods.length > 0 ? (
              visibleFoods.map((food) => {
                const cartItem = cart.find((item) => item._id === food._id);
                const currentPrice = getFoodPrice(food);

                return (
                  <View key={food._id} style={styles.itemCard}>
                    <View style={styles.itemVisual}>
                      <View style={styles.foodIconCircle}>
                        <UtensilsCrossed color={COLORS.green} size={20} />
                      </View>
                    </View>

                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {food.name}
                      </Text>

                      <Text style={styles.itemMeta} numberOfLines={1}>
                        {food.category} • {food.preparationTime} min
                      </Text>

                      <View style={styles.priceRow}>
                        <Text style={styles.itemPrice}>৳{currentPrice}</Text>

                        {food.discountPrice !== null &&
                          food.discountPrice !== undefined &&
                          food.discountPrice < food.price && (
                            <Text style={styles.oldPrice}>৳{food.price}</Text>
                          )}
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={() => handleAddToCart(food)}
                    >
                      {cartItem ? (
                        <>
                          <Text style={styles.addedCount}>
                            {cartItem.quantity}
                          </Text>
                          <CheckCircle color="#FFFFFF" size={15} />
                        </>
                      ) : (
                        <>
                          <Plus color="#FFFFFF" size={17} />
                          <Text style={styles.addBtnText}>Add</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Search color="#9CA3AF" size={30} />
                <Text style={styles.emptyTitle}>No items found</Text>
                <Text style={styles.emptyText}>
                  Try a different search or category.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* BOTTOM CART */}
      {totalItemsCount > 0 && (
        <View style={styles.bottomBar}>
          <View style={styles.orderSummary}>
            <View style={styles.cartCountCircle}>
              <ShoppingBag color={COLORS.green} size={15} />
            </View>

            <View>
              <Text style={styles.bottomBarCount}>
                {totalItemsCount} {totalItemsCount === 1 ? "item" : "items"}
              </Text>
              <Text style={styles.bottomBarPrice}>৳{totalAmount}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.viewCartBtn}
            onPress={() => setIsCartVisible(true)}
          >
            <Text style={styles.viewCartText}>Review Order</Text>
            <ChevronRight color="#FFFFFF" size={18} />
          </TouchableOpacity>
        </View>
      )}

      {/* CART MODAL */}
      <Modal visible={isCartVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.dragHandle} />

            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalKicker}>CURRENT ORDER</Text>
                <Text style={styles.modalTitle}>Review & Send</Text>
              </View>

              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setIsCartVisible(false)}
              >
                <X color="#374151" size={20} />
              </TouchableOpacity>
            </View>

            {/* TABLE */}
            <TouchableOpacity
              style={styles.tableSelectorRow}
              onPress={() => setIsTableModalVisible(true)}
            >
              <View style={styles.tableSelectorLeft}>
                <View style={styles.tableIcon}>
                  <ClipboardList color={COLORS.green} size={17} />
                </View>

                <View>
                  <Text style={styles.tableSelectorLabel}>Serving table</Text>
                  <Text style={styles.tableSelectorValue}>{selectedTable}</Text>
                </View>
              </View>

              <ChevronRight color="#7A847F" size={18} />
            </TouchableOpacity>

            {/* CART ITEMS */}
            <ScrollView
              style={styles.cartList}
              showsVerticalScrollIndicator={false}
            >
              {cart.map((item) => {
                const itemPrice = getFoodPrice(item);

                return (
                  <View key={item._id} style={styles.cartModalItemRow}>
                    <View style={styles.cartMiniIcon}>
                      <UtensilsCrossed color={COLORS.green} size={15} />
                    </View>

                    <View style={styles.cartItemInfo}>
                      <Text style={styles.cartItemName}>{item.name}</Text>
                      <Text style={styles.cartItemPrice}>
                        ৳{itemPrice} each • ৳{itemPrice * item.quantity}
                      </Text>
                    </View>

                    <View style={styles.qtyControlContainer}>
                      <TouchableOpacity
                        onPress={() => updateQuantity(item._id, -1)}
                        style={styles.qtyBtn}
                      >
                        <Minus color={COLORS.green} size={14} />
                      </TouchableOpacity>

                      <Text style={styles.qtyNum}>{item.quantity}</Text>

                      <TouchableOpacity
                        onPress={() => updateQuantity(item._id, 1)}
                        style={styles.qtyBtn}
                      >
                        <Plus color={COLORS.green} size={14} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {/* TOTAL */}
            <View style={styles.modalFooter}>
              <View style={styles.modalTotalRow}>
                <View>
                  <Text style={styles.modalTotalLabel}>Total amount</Text>
                  <Text style={styles.modalTotalSub}>
                    {totalItemsCount} items • {selectedTable}
                  </Text>
                </View>

                <Text style={styles.modalTotalVal}>৳{totalAmount}</Text>
              </View>

              <TouchableOpacity
                style={styles.sendToKitchenBtn}
                onPress={handleSendToKitchen}
              >
                <Send color="#FFFFFF" size={18} />
                <Text style={styles.sendToKitchenText}>Send to Kitchen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* TABLE MODAL */}
      <Modal visible={isTableModalVisible} animationType="fade" transparent>
        <View style={styles.tableModalOverlay}>
          <View style={styles.subModalContent}>
            <View style={styles.subModalHeader}>
              <View>
                <Text style={styles.modalKicker}>ORDER SETUP</Text>
                <Text style={styles.subModalTitle}>Select table</Text>
              </View>

              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setIsTableModalVisible(false)}
              >
                <X color="#374151" size={19} />
              </TouchableOpacity>
            </View>

            <View style={styles.tableGrid}>
              {tablesList.map((table) => (
                <TouchableOpacity
                  key={table}
                  style={[
                    styles.tableOptionRow,
                    selectedTable === table && styles.tableOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedTable(table);
                    setIsTableModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.tableOptionText,
                      selectedTable === table &&
                        styles.tableOptionTextSelected,
                    ]}
                  >
                    {table}
                  </Text>

                  {selectedTable === table && (
                    <CheckCircle color={COLORS.orange} size={18} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F7F6",
  },
  header: {
    backgroundColor: "#0B3C29",
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#FF7A00",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  headerEyebrow: {
    color: "#AFC5BA",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  headerCart: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -4,
    minWidth: 19,
    height: 19,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: "#FF7A00",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#0B3C29",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },
  tableStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#34D399",
    marginRight: 7,
  },
  tableStatusLabel: {
    color: "#C8D6D0",
    fontSize: 12,
    fontWeight: "600",
    marginRight: 7,
  },
  tableStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 9,
  },
  tableStatusText: {
    color: "#0B3C29",
    fontSize: 12,
    fontWeight: "800",
    marginRight: 3,
  },
  successBanner: {
    backgroundColor: "#059669",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 7,
  },
  successText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 12,
  },
  searchSection: {
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: "#E7ECE9",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#18211D",
  },
  categoryArea: {
    marginTop: 8,
    marginBottom: 4,
  },
  sectionLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#8A938F",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  catScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  catTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  catTabActive: {
    backgroundColor: "#0B3C29",
    borderColor: "#0B3C29",
  },
  catTabInactive: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E7ECE9",
  },
  catText: {
    fontSize: 13,
    fontWeight: "600",
  },
  catTextActive: {
    color: "#FFFFFF",
  },
  catTextInactive: {
    color: "#4B5563",
  },
  itemsContainer: {
    padding: 16,
  },
  loadingState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#8A938F",
  },
  menuHeadingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#18211D",
  },
  menuSubtitle: {
    fontSize: 12,
    color: "#8A938F",
    marginTop: 2,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E7ECE9",
    alignItems: "center",
    justifyContent: "center",
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E7ECE9",
  },
  itemVisual: {
    marginRight: 10,
  },
  foodIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#E7ECE9",
    alignItems: "center",
    justifyContent: "center",
  },
  itemInfo: {
    flex: 1,
    justifyContent: "center",
  },
  itemName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#18211D",
    marginBottom: 2,
  },
  itemMeta: {
    fontSize: 11,
    color: "#8A938F",
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0B3C29",
  },
  oldPrice: {
    fontSize: 11,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0B3C29",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 4,
  },
  addBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  addedCount: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#18211D",
    marginTop: 10,
  },
  emptyText: {
    fontSize: 13,
    color: "#8A938F",
    marginTop: 4,
    textAlign: "center",
  },
  bottomBar: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: "#0B3C29",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  orderSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cartCountCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomBarCount: {
    color: "#AFC5BA",
    fontSize: 11,
    fontWeight: "600",
  },
  bottomBarPrice: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  viewCartBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF7A00",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 4,
  },
  viewCartText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    paddingBottom: 30,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
    alignSelf: "center",
    marginTop: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E7ECE9",
  },
  modalKicker: {
    fontSize: 10,
    fontWeight: "800",
    color: "#8A938F",
    letterSpacing: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#18211D",
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  tableSelectorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8F9F8",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E7ECE9",
  },
  tableSelectorLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tableIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#E7ECE9",
    alignItems: "center",
    justifyContent: "center",
  },
  tableSelectorLabel: {
    fontSize: 11,
    color: "#8A938F",
    fontWeight: "600",
  },
  tableSelectorValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0B3C29",
  },
  cartList: {
    paddingHorizontal: 20,
    maxHeight: 280,
  },
  cartModalItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  cartMiniIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#E7ECE9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#18211D",
  },
  cartItemPrice: {
    fontSize: 11,
    color: "#8A938F",
    marginTop: 2,
  },
  qtyControlContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: "#E7ECE9",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyNum: {
    fontSize: 13,
    fontWeight: "700",
    color: "#18211D",
    minWidth: 16,
    textAlign: "center",
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#E7ECE9",
  },
  modalTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  modalTotalLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#18211D",
  },
  modalTotalSub: {
    fontSize: 11,
    color: "#8A938F",
    marginTop: 2,
  },
  modalTotalVal: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0B3C29",
  },
  sendToKitchenBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF7A00",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  sendToKitchenText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  tableModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  subModalContent: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    maxWidth: 360,
  },
  subModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E7ECE9",
  },
  subModalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#18211D",
  },
  tableGrid: {
    gap: 6,
  },
  tableOptionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#F8F9F8",
    borderWidth: 1,
    borderColor: "#E7ECE9",
  },
  tableOptionSelected: {
    backgroundColor: "#FFF5EC",
    borderColor: "#FF7A00",
  },
  tableOptionText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#18211D",
  },
  tableOptionTextSelected: {
    color: "#FF7A00",
  },
});