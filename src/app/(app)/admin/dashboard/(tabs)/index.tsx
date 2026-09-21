import React, { useCallback, useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ShieldCheck,
  RefreshCw,
  Trash2,
  UtensilsCrossed,
  CircleCheck,
  CircleX,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Leaf,
  Clock,
} from "lucide-react-native";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig?.extra?.API_URL;

const COLORS = {
  primary: "#0F2A1D",
  primaryLight: "#163827",
  orange: "#F97316",
  adminRed: "#EF4444",
  background: "#F4F7F5",
  card: "#FFFFFF",
  text: "#090D16",
  textSecondary: "#64748B",
  border: "#E2E8F0",
  success: "#10B981",
  badgeBg: "#F1F5F9",
};

type FoodVariant = {
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
  category:
    | string
    | {
        _id: string;
        name: string;
      };
  price: number;
  discountPrice?: number | null;
  image:
    | string
    | {
        url: string;
        public_id?: string;
      };
  isAvailable: boolean;
  isFeatured?: boolean;
  isVegetarian?: boolean;
  preparationTime?: number;
  variants?: FoodVariant[];
};

export default function AdminFoodScreen() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [expandedVariants, setExpandedVariants] = useState<Record<string, boolean>>({});

  const getFoodImage = (food: Food) => {
    if (typeof food.image === "string") return food.image;
    return food.image?.url || "";
  };

  const formatCurrency = (amount: number) => {
    return `৳${Number(amount || 0).toLocaleString("en-BD")}`;
  };

  const hasDiscount = (price: number, discountPrice?: number | null) => {
    return (
      discountPrice !== null &&
      discountPrice !== undefined &&
      Number(discountPrice) < Number(price)
    );
  };

  const fetchFoods = useCallback(async () => {
    if (!API_URL) {
      setError("API configuration is missing.");
      setLoading(false);
      return;
    }

    try {
      setError("");
      const response = await fetch(`${API_URL}/api/admin/food/getFood`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load food items.");
      }

      const foodData: Food[] = Array.isArray(data)
        ? data
        : Array.isArray(data.foods)
        ? data.foods
        : Array.isArray(data.data)
        ? data.data
        : [];

      setFoods(foodData);
    } catch (error: any) {
      console.error("Fetch food error:", error);
      setError(error?.message || "Unable to load food items.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFoods();
  }, [fetchFoods]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchFoods();
  };

  const toggleVariants = (foodId: string) => {
    setExpandedVariants((previous) => ({
      ...previous,
      [foodId]: !previous[foodId],
    }));
  };

  const handleDelete = (food: Food) => {
    Alert.alert(
      "Delete Food",
      `Are you sure you want to delete "${food.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => confirmDelete(food._id) },
      ]
    );
  };

  const confirmDelete = async (foodId: string) => {
    if (!API_URL) return;

    try {
      setDeletingId(foodId);
      const response = await fetch(`${API_URL}/api/admin/food/deleteFood`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ foodId }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete food item.");
      }

      setFoods((prev) => prev.filter((food) => food._id !== foodId));
      Alert.alert("Deleted", "Food item deleted successfully.");
    } catch (error: any) {
      Alert.alert("Delete Failed", error?.message || "Unable to delete this food item.");
    } finally {
      setDeletingId(null);
    }
  };

  const renderVariant = (variant: FoodVariant, index: number) => {
    const variantHasDiscount = hasDiscount(variant.price, variant.discountPrice);
    const finalPrice =
      variant.discountPrice !== null && variant.discountPrice !== undefined
        ? Number(variant.discountPrice)
        : Number(variant.price);

    return (
      <View key={variant._id || `${variant.name}-${index}`} style={styles.variantCard}>
        <View style={styles.variantLeft}>
          <View style={styles.variantNumber}>
            <Text style={styles.variantNumberText}>{index + 1}</Text>
          </View>
          <View style={styles.variantInfo}>
            <Text style={styles.variantName} numberOfLines={1}>
              {variant.name}
            </Text>
            <View style={styles.variantPriceRow}>
              <Text style={styles.variantFinalPrice}>{formatCurrency(finalPrice)}</Text>
              {variantHasDiscount && (
                <Text style={styles.variantOriginalPrice}>{formatCurrency(variant.price)}</Text>
              )}
            </View>
          </View>
        </View>

        <View
          style={[
            styles.variantAvailability,
            { backgroundColor: variant.isAvailable === false ? "#FEF2F2" : "#ECFDF5" },
          ]}
        >
          {variant.isAvailable === false ? (
            <CircleX size={10} color={COLORS.adminRed} />
          ) : (
            <CircleCheck size={10} color={COLORS.success} />
          )}
          <Text
            style={[
              styles.variantAvailabilityText,
              { color: variant.isAvailable === false ? COLORS.adminRed : COLORS.success },
            ]}
          >
            {variant.isAvailable === false ? "Off" : "Active"}
          </Text>
        </View>
      </View>
    );
  };

  const renderFoodCard = ({ item: food }: { item: Food }) => {
    const imageUrl = getFoodImage(food);
    const foodHasDiscount = hasDiscount(food.price, food.discountPrice);
    const isDeleting = deletingId === food._id;
    const variants = Array.isArray(food.variants) ? food.variants : [];
    const hasVariants = variants.length > 0;
    const variantsExpanded = expandedVariants[food._id] ?? false;
    const foodFinalPrice =
      food.discountPrice !== null && food.discountPrice !== undefined
        ? Number(food.discountPrice)
        : Number(food.price);

    return (
      <View style={[styles.foodCard, isDeleting && styles.foodCardDeleting]}>
        {/* IMAGE CONTAINER */}
        <View style={styles.foodImageContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.foodImage} resizeMode="cover" />
          ) : (
            <View style={styles.noImage}>
              <UtensilsCrossed size={24} color={COLORS.textSecondary} />
            </View>
          )}

          {/* CATEGORY OVERLAY */}
          {/* <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText} numberOfLines={1}>{food.categoryName}</Text>
          </View> */}

          {/* AVAILABILITY BADGE */}
          <View
            style={[
              styles.availabilityBadge,
              { backgroundColor: food.isAvailable ? "#ECFDF5" : "#FEF2F2" },
            ]}
          >
            {food.isAvailable ? (
              <CircleCheck size={11} color={COLORS.success} />
            ) : (
              <CircleX size={11} color={COLORS.adminRed} />
            )}
            <Text
              style={[
                styles.availabilityText,
                { color: food.isAvailable ? COLORS.success : COLORS.adminRed },
              ]}
            >
              {food.isAvailable ? "Available" : "Hidden"}
            </Text>
          </View>
        </View>

        {/* CONTENT */}
        <View style={styles.foodContent}>
          <View style={styles.foodTitleRow}>
            <Text style={styles.foodName} numberOfLines={1}>
              {food.name}
            </Text>
          </View>

          {food.description ? (
            <Text style={styles.description} numberOfLines={2}>
              {food.description}
            </Text>
          ) : null}

          {/* META TAGS (TIME / VEG / FEATURED) */}
          <View style={styles.metaRow}>
            {food.preparationTime ? (
              <View style={styles.metaBadge}>
                <Clock size={10} color={COLORS.textSecondary} />
                <Text style={styles.metaText}>{food.preparationTime}m</Text>
              </View>
            ) : null}

            {food.isVegetarian ? (
              <View style={[styles.metaBadge, { backgroundColor: "#ECFDF5" }]}>
                <Leaf size={10} color={COLORS.success} />
                <Text style={[styles.metaText, { color: COLORS.success }]}>Veg</Text>
              </View>
            ) : null}

            {food.isFeatured ? (
              <View style={[styles.metaBadge, { backgroundColor: "#FFF7ED" }]}>
                <Sparkles size={10} color={COLORS.orange} />
                <Text style={[styles.metaText, { color: COLORS.orange }]}>Featured</Text>
              </View>
            ) : null}
          </View>

          {/* PRICE ROW */}
          <View style={styles.priceRow}>
            {foodHasDiscount ? (
              <>
                <Text style={styles.discountPrice}>{formatCurrency(foodFinalPrice)}</Text>
                <Text style={styles.originalPrice}>{formatCurrency(food.price)}</Text>
              </>
            ) : (
              <Text style={styles.normalPrice}>{formatCurrency(food.price)}</Text>
            )}
          </View>

          {/* VARIANTS SECTION */}
          {hasVariants ? (
            <View style={styles.variantsSection}>
              <TouchableOpacity
                style={styles.variantHeader}
                onPress={() => toggleVariants(food._id)}
                activeOpacity={0.7}
              >
                <View style={styles.variantHeaderLeft}>
                  <Text style={styles.variantHeaderTitle}>Variants</Text>
                  <View style={styles.variantHeaderCount}>
                    <Text style={styles.variantHeaderCountText}>{variants.length}</Text>
                  </View>
                </View>
                {variantsExpanded ? (
                  <ChevronUp size={14} color={COLORS.primary} />
                ) : (
                  <ChevronDown size={14} color={COLORS.primary} />
                )}
              </TouchableOpacity>

              {variantsExpanded && (
                <View style={styles.variantList}>
                  {variants.map((v, i) => renderVariant(v, i))}
                </View>
              )}
            </View>
          ) : null}

          {/* DELETE BUTTON */}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(food)}
            disabled={isDeleting}
            activeOpacity={0.7}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color={COLORS.adminRed} />
            ) : (
              <>
                <Trash2 size={13} color={COLORS.adminRed} />
                <Text style={styles.deleteButtonText}>Remove Item</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.adminBadgeIcon}>
            <ShieldCheck size={20} color="#34D399" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Food Management</Text>
            <Text style={styles.headerSubtitle}>Amar Adda Dashboard</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.headerRefreshButton} onPress={fetchFoods} activeOpacity={0.7}>
          <RefreshCw size={17} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <FlatList
          data={foods}
          renderItem={renderFoodCard}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <View>
                <Text style={styles.sectionTitle}>Menu Items</Text>
                <Text style={styles.sectionSubtitle}>
                  {foods.length} active dish{foods.length !== 1 ? "es" : ""} found
                </Text>
              </View>

              {error ? (
                <View style={styles.errorCard}>
                  <CircleX size={18} color={COLORS.adminRed} />
                  <View style={styles.errorContent}>
                    <Text style={styles.errorTitle}>Error Loading Data</Text>
                    <Text style={styles.errorMessage}>{error}</Text>
                  </View>
                  <TouchableOpacity onPress={fetchFoods} style={styles.retryButton}>
                    <Text style={styles.retryText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={styles.loadingText}>Syncing menu catalog...</Text>
                </View>
              ) : null}

              {!loading && !error && foods.length === 0 ? (
                <View style={styles.emptyCard}>
                  <View style={styles.emptyIcon}>
                    <UtensilsCrossed size={24} color={COLORS.primary} />
                  </View>
                  <Text style={styles.emptyTitle}>No Foods Added</Text>
                  <Text style={styles.emptyText}>Your menu catalog is currently empty.</Text>
                </View>
              ) : null}
            </View>
          }
          ListFooterComponent={<View style={{ height: 40 }} />}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.primary,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  adminBadgeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(52, 211, 153, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.2)",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "400",
    marginTop: 1,
  },
  headerRefreshButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 14,
    paddingTop: 18,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  listHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: 14,
    fontWeight: "500",
  },
  foodCard: {
    width: "48%",
    backgroundColor: COLORS.card,
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  foodCardDeleting: {
    opacity: 0.5,
  },
  foodImageContainer: {
    width: "100%",
    height: 120,
    backgroundColor: "#E2E8F0",
    position: "relative",
  },
  foodImage: {
    width: "100%",
    height: "100%",
  },
  noImage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EEF2F6",
  },
  categoryBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: "70%",
  },
  categoryBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "600",
  },
  availabilityBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  availabilityText: {
    fontSize: 9,
    fontWeight: "700",
  },
  foodContent: {
    padding: 10,
  },
  foodTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  foodName: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    flex: 1,
  },
  description: {
    fontSize: 10,
    lineHeight: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 8,
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metaText: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  normalPrice: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.primary,
  },
  discountPrice: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.orange,
  },
  originalPrice: {
    fontSize: 10,
    fontWeight: "500",
    color: COLORS.textSecondary,
    textDecorationLine: "line-through",
  },
  variantsSection: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#FAFAFA",
  },
  variantHeader: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F1F5F9",
  },
  variantHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  variantHeaderTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.primary,
  },
  variantHeaderCount: {
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  variantHeaderCountText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "700",
  },
  variantList: {
    padding: 6,
    gap: 5,
  },
  variantCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  variantLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  variantNumber: {
    width: 18,
    height: 18,
    borderRadius: 5,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  variantNumberText: {
    fontSize: 8,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  variantInfo: {
    flex: 1,
  },
  variantName: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.text,
  },
  variantPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 1,
  },
  variantFinalPrice: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.orange,
  },
  variantOriginalPrice: {
    fontSize: 8,
    color: COLORS.textSecondary,
    textDecorationLine: "line-through",
  },
  variantAvailability: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
  },
  variantAvailabilityText: {
    fontSize: 7,
    fontWeight: "700",
  },
  deleteButton: {
    height: 32,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.15)",
  },
  deleteButtonText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.adminRed,
  },
  loadingContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingVertical: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "500",
    marginTop: 8,
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  emptyText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 2,
  },
  errorCard: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
    borderRadius: 12,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  errorContent: {
    flex: 1,
    marginLeft: 8,
  },
  errorTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.adminRed,
  },
  errorMessage: {
    fontSize: 9,
    color: "#9F1239",
    marginTop: 1,
  },
  retryButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  retryText: {
    fontSize: 9,
    color: COLORS.adminRed,
    fontWeight: "700",
  },
});