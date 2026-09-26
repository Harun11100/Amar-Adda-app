import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ChevronDown,
  Minus,
  Plus,
  Search,
  Table2,
  X,
  ShoppingCart,
} from "lucide-react-native";
import Constants from "expo-constants";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from "../../../store/authStore"; // Update path if needed

const API_URL = Constants.expoConfig?.extra?.API_URL;

const COLORS = {
  green: "#0B3C29",
  greenDark: "#082F21",
  greenLight: "#EAF4EF",

  orange: "#FF7A00",
  orangeLight: "#FFF3E8",

  white: "#FFFFFF",
  background: "#F5F7F6",
  card: "#FFFFFF",

  text: "#18211D",
  textSecondary: "#66716C",
  muted: "#8A938F",

  border: "#E4E9E6",

  danger: "#D92D20",
  dangerLight: "#FFF0EF",

  success: "#16844A",
};

type Variant = {
  _id?: string;
  name: string;
  price: number;
  discountPrice?: number | null;
  isAvailable?: boolean;
};

type Food = {
  _id: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  discountPrice?: number | null;
  effectivePrice?: number;
  image?: string;
  isAvailable?: boolean;
  isFeatured?: boolean;
  variants?: Variant[];
};

type CartItem = Food & {
  quantity: number;
  selectedVariant?: Variant;
};

type Table = {
  _id?: string;
  id?: string;
  name?: string;
  tableNumber?: number | string;
  number?: number | string;
};

export default function WaiterOrderFlowScreen() {
  // Pull user data and session restore from global store
  const user = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const checkSavedSession = useAuthStore((state) => state.checkSavedSession);

  const userName = user?.name || "";

  const [foods, setFoods] = useState<Food[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Table
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | string | null>(null);
  const [isTableModalVisible, setIsTableModalVisible] = useState(false);

  // Variant
  const [variantFood, setVariantFood] = useState<Food | null>(null);
  const [isVariantModalVisible, setIsVariantModalVisible] = useState(false);

  // Restore session on mount
  useEffect(() => {
    checkSavedSession();
  }, []);

  // ---------------------------------------------------------
  // FALLBACK TABLES
  // ---------------------------------------------------------
  const createFallbackTables = (): Table[] => {
    return Array.from({ length: 25 }, (_, index) => ({
      id: String(index + 1),
      tableNumber: index + 1,
      name: `Table ${index + 1}`,
    }));
  };

  // ---------------------------------------------------------
  // FETCH DATA & RESET SELECTIONS ON REFRESH
  // ---------------------------------------------------------
  const fetchData = useCallback(async (isRefresh = false) => {
    if (!API_URL) {
      setErrorMessage(
        "API_URL is not configured. Please check your Expo environment configuration."
      );
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
        setCart([]);
        setSelectedTable(null);
        setSearchQuery("");
        setSelectedCategory("All");
      } else {
        setLoading(true);
      }

      setErrorMessage(null);

      const [foodRes, tableRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/food/getFood`),
        fetch(`${API_URL}/api/admin/table/getTables`).catch(() => null),
      ]);

      const foodData = await foodRes.json();

      if (!foodRes.ok || !foodData?.success) {
        throw new Error(foodData?.message || "Failed to load menu.");
      }

      const foodList: Food[] = Array.isArray(foodData.foods)
        ? foodData.foods
        : [];

      setFoods(foodList);

      let loadedTables: Table[] = [];

      if (tableRes?.ok) {
        try {
          const tableData = await tableRes.json();
          if (
            tableData?.success &&
            Array.isArray(tableData.tables) &&
            tableData.tables.length > 0
          ) {
            loadedTables = tableData.tables;
          }
        } catch {
          // Fallback handled below
        }
      }

      if (loadedTables.length === 0) {
        loadedTables = createFallbackTables();
      }

      setTables(loadedTables);
    } catch (error: any) {
      const message = error?.message || "Unable to load restaurant data.";
      setErrorMessage(message);
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ---------------------------------------------------------
  // PRICE HELPERS
  // ---------------------------------------------------------
  const getVariantPrice = (variant: Variant) => {
    return variant.discountPrice ?? variant.price;
  };

  const getFoodPrice = (item: Food | CartItem) => {
    if ("selectedVariant" in item && item.selectedVariant) {
      return getVariantPrice(item.selectedVariant);
    }

    return (
      item.effectivePrice ??
      item.discountPrice ??
      item.price
    );
  };

  // ---------------------------------------------------------
  // CART KEY
  // ---------------------------------------------------------
  const getCartKey = (item: Pick<CartItem, "_id" | "selectedVariant">) => {
    if (item.selectedVariant) {
      const variantIdentifier = item.selectedVariant._id || item.selectedVariant.name;
      return `${item._id}-variant-${variantIdentifier}`;
    }
    return `${item._id}-base`;
  };

  // ---------------------------------------------------------
  // CART UPDATE
  // ---------------------------------------------------------
  const updateCart = (food: Food, variant?: Variant, delta = 1) => {
    const key = getCartKey({
      _id: food._id,
      selectedVariant: variant,
    });

    setCart((previousCart) => {
      const existingIndex = previousCart.findIndex(
        (item) => getCartKey(item) === key
      );

      if (existingIndex !== -1) {
        const updatedCart = [...previousCart];
        const existingItem = updatedCart[existingIndex];
        const newQuantity = existingItem.quantity + delta;

        if (newQuantity <= 0) {
          return updatedCart.filter((_, index) => index !== existingIndex);
        }

        updatedCart[existingIndex] = {
          ...existingItem,
          quantity: newQuantity,
        };

        return updatedCart;
      }

      if (delta > 0) {
        return [
          ...previousCart,
          {
            ...food,
            selectedVariant: variant,
            quantity: 1,
          },
        ];
      }

      return previousCart;
    });
  };

  const getQuantity = (foodId: string, variant?: Variant) => {
    const key = getCartKey({
      _id: foodId,
      selectedVariant: variant,
    });

    const item = cart.find((cartItem) => getCartKey(cartItem) === key);
    return item?.quantity || 0;
  };

  const getAvailableVariants = (food: Food) => {
    return (
      food.variants?.filter((variant) => variant.isAvailable !== false) || []
    );
  };

  const filteredFoods = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return foods.filter((food) => {
      if (food.isAvailable === false) {
        return false;
      }

      const categoryMatch =
        selectedCategory === "All" || food.category === selectedCategory;

      const searchMatch =
        !query ||
        food.name.toLowerCase().includes(query) ||
        food.description?.toLowerCase().includes(query);

      return categoryMatch && Boolean(searchMatch);
    });
  }, [foods, selectedCategory, searchQuery]);

  const { itemCount, subtotal } = useMemo(() => {
    return cart.reduce(
      (total, item) => {
        total.itemCount += item.quantity;
        total.subtotal += getFoodPrice(item) * item.quantity;
        return total;
      },
      { itemCount: 0, subtotal: 0 }
    );
  }, [cart]);

  const openVariantSelector = (food: Food) => {
    const availableVariants = getAvailableVariants(food);

    if (availableVariants.length === 0) {
      updateCart(food);
      return;
    }

    setVariantFood(food);
    setIsVariantModalVisible(true);
  };

  const closeVariantModal = () => {
    setIsVariantModalVisible(false);
    setVariantFood(null);
  };

  const getTableDisplayName = (table: Table) => {
    if (table.name) {
      return table.name;
    }

    const number = table.tableNumber ?? table.number;
    if (number !== undefined && number !== null) {
      return `Table ${number}`;
    }

    return "Table";
  };

  const getTableValue = (table: Table) => {
    return table.tableNumber ?? table.number ?? table.name ?? table.id ?? null;
  };

  const handlePlaceOrder = async () => {
    if (selectedTable === null) {
      Alert.alert("Select Table", "Please select a table before placing the order.");
      return;
    }

    if (cart.length === 0) {
      Alert.alert("Empty Order", "Please add at least one food item.");
      return;
    }

    if (!API_URL) {
      Alert.alert("Configuration Error", "API_URL is not configured.");
      return;
    }

    try {
      setSubmittingOrder(true);

      const payload = {
        tableNumber: selectedTable,
        items: cart.map((item) => ({
          food: item._id,
          name: item.name,
          quantity: item.quantity,
          price: getFoodPrice(item),
          variant: item.selectedVariant
            ? {
                id: item.selectedVariant._id || null,
                name: item.selectedVariant.name,
                price: getVariantPrice(item.selectedVariant),
              }
            : null,
        })),
        subtotal,
        totalNumber: itemCount,
        total: subtotal,
        staffName: userName,
      };

      const response = await fetch(`${API_URL}/api/admin/order/createOrder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Failed to create order.");
      }

      Alert.alert(
        "Order Placed",
        `Order placed successfully for Table ${selectedTable}.`,
        [
          {
            text: "OK",
            onPress: () => {
              setCart([]);
              setSelectedTable(null);
              setSearchQuery("");
              setSelectedCategory("All");
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        "Order Failed",
        error?.message || "Something went wrong while placing the order."
      );
    } finally {
      setSubmittingOrder(false);
    }
  };

  if (loading || !isHydrated) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.green} />
        <View style={styles.loadingIcon}>
          <ShoppingCart size={30} color={COLORS.orange} />
        </View>
        <ActivityIndicator size="large" color={COLORS.orange} />
        <Text style={styles.loadingText}>Loading menu...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.green} />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerKicker}>AMAR ADDA</Text>
          <Text style={styles.headerTitle}>Create Order</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.tableButton}
          onPress={() => setIsTableModalVisible(true)}
        >
          <Table2 size={17} color={COLORS.white} />
          <Text numberOfLines={1} style={styles.tableButtonText}>
            {selectedTable !== null ? `Table ${selectedTable}` : "Select Table"}
          </Text>
          <ChevronDown size={15} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* SEARCH */}
      <View style={styles.searchWrapper}>
        <Search size={19} color={COLORS.muted} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search food..."
          placeholderTextColor={COLORS.muted}
          style={styles.searchInput}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={10}>
            <X size={17} color={COLORS.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* MAIN CONTENT */}
      <View style={styles.mainContent}>
        {/* FOOD SECTION */}
        <View style={styles.foodSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Menu</Text>
              <Text style={styles.sectionSubtitle}>{filteredFoods.length} items available</Text>
            </View>
            {refreshing && <ActivityIndicator size="small" color={COLORS.green} />}
          </View>

          {filteredFoods.length === 0 ? (
            <View style={styles.emptyFood}>
              <Search size={36} color={COLORS.muted} />
              <Text style={styles.emptyFoodTitle}>No food found</Text>
              <Text style={styles.emptyFoodText}>Try another search or category.</Text>
            </View>
          ) : (
            <FlatList
              data={filteredFoods}
              keyExtractor={(item) => item._id}
              numColumns={2}
              showsVerticalScrollIndicator={false}
              refreshing={refreshing}
              onRefresh={() => fetchData(true)}
              columnWrapperStyle={styles.foodColumnWrapper}
              contentContainerStyle={styles.foodListContent}
              renderItem={({ item }) => {
                const variants = getAvailableVariants(item);
                const hasVariants = variants.length > 0;
                const directQuantity = getQuantity(item._id);

                return (
                  <View style={styles.foodCard}>
                    {item.image ? (
                      <Image source={{ uri: item.image }} style={styles.foodImage} resizeMode="cover" />
                    ) : (
                      <View style={[styles.foodImage, styles.imagePlaceholder]}>
                        <ShoppingCart size={30} color={COLORS.muted} />
                      </View>
                    )}

                    <View style={styles.foodContent}>
                      <Text numberOfLines={1} style={styles.foodCategory}>{item.name}</Text>
                      <Text style={styles.foodPrice}>৳{item.discountPrice ?? item.price}</Text>

                      {hasVariants ? (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          style={styles.addButton}
                          onPress={() => openVariantSelector(item)}
                        >
                          <Plus size={14} color={COLORS.white} />
                          <Text style={styles.addButtonText}>Choose</Text>
                        </TouchableOpacity>
                      ) : directQuantity > 0 ? (
                        <View style={styles.quantityControl}>
                          <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() => updateCart(item, undefined, -1)}
                          >
                            <Minus size={14} color={COLORS.green} />
                          </TouchableOpacity>
                          <Text style={styles.quantityText}>{directQuantity}</Text>
                          <TouchableOpacity
                            style={styles.quantityAddButton}
                            onPress={() => updateCart(item, undefined, 1)}
                          >
                            <Plus size={14} color={COLORS.white} />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          style={styles.addButton}
                          onPress={() => updateCart(item, undefined, 1)}
                        >
                          <Plus size={14} color={COLORS.white} />
                          <Text style={styles.addButtonText}>Add</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              }}
            />
          )}
        </View>

        {/* CART SECTION */}
        <View style={styles.cartSection}>
          <View style={styles.cartHeader}>
            <View>
              <Text style={styles.cartTitle}>Order</Text>
              <Text style={styles.cartSubtitle}>{itemCount} {itemCount === 1 ? "item" : "items"}</Text>
            </View>
            <View style={styles.cartCountBadge}>
              <ShoppingCart size={15} color={COLORS.green} />
              <Text style={styles.cartCountBadgeText}>{itemCount}</Text>
            </View>
          </View>

          {cart.length === 0 ? (
            <View style={styles.emptyCart}>
              <ShoppingCart size={28} color={COLORS.muted} />
              <Text style={styles.emptyCartText}>No items added yet</Text>
            </View>
          ) : (
            <FlatList
              data={cart}
              keyExtractor={getCartKey}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.cartListContent}
              renderItem={({ item }) => (
                <View style={styles.cartItem}>
                  <View style={styles.cartItemInfo}>
                    <Text numberOfLines={1} style={styles.cartItemName}>{item.name}</Text>
                    {item.selectedVariant && (
                      <Text numberOfLines={1} style={styles.selectedVariantText}>
                        {item.selectedVariant.name}
                      </Text>
                    )}
                    <Text style={styles.cartItemPrice}>৳{getFoodPrice(item)} × {item.quantity}</Text>
                  </View>

                  <View style={styles.quantityControl}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateCart(item, item.selectedVariant, -1)}
                    >
                      <Minus size={13} color={COLORS.green} />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityAddButton}
                      onPress={() => updateCart(item, item.selectedVariant, 1)}
                    >
                      <Plus size={13} color={COLORS.white} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}

          <View style={styles.totalContainer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>৳{subtotal}</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.placeOrderButton,
                (submittingOrder || cart.length === 0 || selectedTable === null) &&
                  styles.placeOrderButtonDisabled,
              ]}
              onPress={handlePlaceOrder}
              disabled={submittingOrder || cart.length === 0 || selectedTable === null}
            >
              {submittingOrder ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.placeOrderText}>Place Order</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* TABLE MODAL */}
      <Modal
        visible={isTableModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsTableModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select Table</Text>
                <Text style={styles.modalSubtitle}>Choose the customer's table</Text>
              </View>
              <TouchableOpacity style={styles.modalCloseIcon} onPress={() => setIsTableModalVisible(false)}>
                <X size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={tables}
              keyExtractor={(table, index) => String(table._id || table.id || index)}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalList}
              renderItem={({ item }) => {
                const value = getTableValue(item);
                const isSelected = String(value) === String(selectedTable);

                return (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.tableItem, isSelected && styles.tableItemSelected]}
                    onPress={() => {
                      if (value === null || value === undefined) return;
                      setSelectedTable(value);
                      setIsTableModalVisible(false);
                    }}
                  >
                    <View style={styles.tableIcon}>
                      <Table2 size={18} color={isSelected ? COLORS.white : COLORS.green} />
                    </View>
                    <Text style={[styles.tableItemText, isSelected && styles.tableItemTextSelected]}>
                      {getTableDisplayName(item)}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* VARIANT MODAL */}
      <Modal
        visible={isVariantModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeVariantModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select Variant</Text>
                <Text style={styles.modalSubtitle}>{variantFood?.name}</Text>
              </View>
              <TouchableOpacity style={styles.modalCloseIcon} onPress={closeVariantModal}>
                <X size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={variantFood ? getAvailableVariants(variantFood) : []}
              keyExtractor={(v, i) => String(v._id || i)}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalList}
              renderItem={({ item: variant }) => (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.tableItem}
                  onPress={() => {
                    if (variantFood) {
                      updateCart(variantFood, variant, 1);
                    }
                    closeVariantModal();
                  }}
                >
                  <View style={styles.tableIcon}>
                    <Plus size={18} color={COLORS.green} />
                  </View>
                  <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.tableItemText}>{variant.name}</Text>
                    <Text style={[styles.tableItemText, { color: COLORS.green }]}>৳{getVariantPrice(variant)}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.green },
  loadingScreen: { flex: 1, backgroundColor: COLORS.green, justifyContent: 'center', alignItems: 'center' },
  loadingIcon: { marginBottom: 16 },
  loadingText: { color: COLORS.white, marginTop: 12, fontSize: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10 },
  headerLeft: {},
  headerKicker: { color: COLORS.orange, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  headerTitle: { color: COLORS.white, fontSize: 20, fontWeight: 'bold' },
  tableButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  tableButtonText: { color: COLORS.white, marginHorizontal: 6, fontWeight: '600', maxWidth: 100 },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 12, borderRadius: 10, height: 44 },
  searchInput: { flex: 1, marginLeft: 8, color: COLORS.text, fontSize: 15 },
  mainContent: { flex: 1, backgroundColor: COLORS.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', flexDirection: 'row' },
  foodSection: { flex: 1, padding: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  sectionSubtitle: { fontSize: 12, color: COLORS.textSecondary },
  emptyFood: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyFoodTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginTop: 8 },
  emptyFoodText: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  foodColumnWrapper: { justifyContent: 'space-between' },
  foodListContent: { paddingBottom: 20 },
  foodCard: { backgroundColor: COLORS.card, width: '48%', borderRadius: 12, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  foodImage: { width: '100%', height: 100 },
  imagePlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.greenLight },
  foodContent: { padding: 8 },
  foodName: { fontSize: 14, fontWeight: 'bold', color: COLORS.text },
  foodCategory: { fontSize: 12, color: COLORS.text, fontWeight: 'bold', marginBottom: 4 },
  foodPrice: { fontSize: 13, fontWeight: 'bold', color: COLORS.success, marginBottom: 8 },
  addButton: { flexDirection: 'row', backgroundColor: COLORS.green, paddingVertical: 6, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  addButtonText: { color: COLORS.white, fontSize: 12, fontWeight: '600', marginLeft: 4 },
  quantityControl: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.greenLight, borderRadius: 6, padding: 2 },
  quantityButton: { padding: 4 },
  quantityAddButton: { backgroundColor: COLORS.green, borderRadius: 4, padding: 4 },
  quantityText: { fontSize: 13, fontWeight: 'bold', color: COLORS.green },
  cartSection: { width: '40%', backgroundColor: COLORS.white, borderLeftWidth: 1, borderLeftColor: COLORS.border, padding: 12, justifyContent: 'space-between' },
  cartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cartTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
  cartSubtitle: { fontSize: 11, color: COLORS.textSecondary },
  cartCountBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.greenLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  cartCountBadgeText: { fontSize: 11, fontWeight: 'bold', color: COLORS.green, marginLeft: 4 },
  emptyCart: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyCartText: { fontSize: 12, color: COLORS.muted, marginTop: 4 },
  cartListContent: { paddingBottom: 10 },
  cartItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  cartItemInfo: { flex: 1, marginRight: 8 },
  cartItemName: { fontSize: 12, fontWeight: 'bold', color: COLORS.text },
  selectedVariantText: { fontSize: 10, color: COLORS.textSecondary },
  cartItemPrice: { fontSize: 11, color: COLORS.success, marginTop: 2 },
  totalContainer: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  totalLabel: { fontSize: 14, fontWeight: 'bold', color: COLORS.text },
  totalAmount: { fontSize: 14, fontWeight: 'bold', color: COLORS.success },
  placeOrderButton: { backgroundColor: COLORS.orange, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  placeOrderButtonDisabled: { opacity: 0.5 },
  placeOrderText: { color: COLORS.white, fontWeight: 'bold', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '60%', padding: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  modalSubtitle: { fontSize: 12, color: COLORS.textSecondary },
  modalCloseIcon: { padding: 4 },
  modalList: { paddingBottom: 16 },
  tableItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border, borderRadius: 8 },
  tableItemSelected: { backgroundColor: COLORS.green },
  tableIcon: { marginRight: 12 },
  tableItemText: { fontSize: 15, color: COLORS.text, fontWeight: '600' },
  tableItemTextSelected: { color: COLORS.white },
});