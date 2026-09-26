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
  TextInput,
  Keyboard,
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
  Search,
  X,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Eye,
} from "lucide-react-native";
import Constants from "expo-constants";
import { useRouter } from "expo-router";

const API_URL = Constants.expoConfig?.extra?.API_URL;

const COLORS = {
  primary: "#0B3C29", 
  primaryLight: "#1F2937",
  emerald: "#059669",
  orange: "#EA580C",
  adminRed: "#DC2626",
  background: "#F8FAFC",
  card: "#FFFFFF",
  text: "#0F172A",
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

type StatsData = {
  totalSoldToday: number;
  totalOrderToday: number;
};

export default function AdminFoodScreen() {

  const router = useRouter();
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [stats, setStats] = useState<StatsData>({
    totalSoldToday: 0,
    totalOrderToday: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingVariantKey, setDeletingVariantKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [expandedVariants, setExpandedVariants] = useState<Record<string, boolean>>({});

  // Debounce search input to avoid too many fetches while typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  const fetchStatistics = async () => {
    if (!API_URL) return;
    try {
      setStatsLoading(true);
      const response = await fetch(`${API_URL}/api/admin/today-stats`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setStats({
          totalSoldToday: data.stats?.totalSoldToday || 0,
          totalOrderToday: data.stats?.totalOrderToday || 0,
       
        });
      }
    } catch (err) {
      console.error("Failed to load statistics:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchFoods = useCallback(async (pageNumber = 1, isRefresh = false, search = "") => {
    if (!API_URL) {
      setError("API configuration is missing.");
      setLoading(false);
      return;
    }

    try {
      if (pageNumber === 1 && !isRefresh) {
        setLoading(true);
      }
      setError(""); 

      const response = await fetch(
        `${API_URL}/api/admin/getFood?page=${pageNumber}&limit=10&search=${encodeURIComponent(
          search
        )}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
        }
      );

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

      if (foodData.length < 10) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      if (pageNumber === 1) {
        setFoods(foodData);
      } else {
        setFoods((prev) => {
          const existingIds = new Set(prev.map((f) => f._id));
          const uniqueNewFoods = foodData.filter((f) => !existingIds.has(f._id));
          return [...prev, ...uniqueNewFoods];
        });
      }

      setPage(pageNumber);
    } catch (error: any) {
      console.error("Fetch food error:", error);
      setError(error?.message || "Unable to load food items.");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchFoods(1, false, debouncedSearch);
    fetchStatistics();
  }, [debouncedSearch, fetchFoods]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    await Promise.all([fetchFoods(1, true, debouncedSearch), fetchStatistics()]);
  };

  const handleLoadMore = () => {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    fetchFoods(nextPage, false, debouncedSearch);
  };

  const handleViewTodaysSoldItems = () => {
    // Implement navigation or modal popup to view today's sold items list
    router.push("/admin/sold-item-list");
  }

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
      fetchStatistics();
      Alert.alert("Deleted", "Food item deleted successfully.");
    } catch (error: any) {
      Alert.alert("Delete Failed", error?.message || "Unable to delete this food item.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteVariant = (foodId: string, variant: FoodVariant, variantIndex: number) => {
    const variantIdentifier = variant._id || `${variant.name}-${variantIndex}`;
    Alert.alert(
      "Delete Variant",
      `Are you sure you want to remove variant "${variant.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => confirmDeleteVariant(foodId, variantIdentifier, variantIndex),
        },
      ]
    );
  };

  const confirmDeleteVariant = async (foodId: string, variantIdentifier: string, variantIndex: number) => {
    if (!API_URL) return;

    const targetFood = foods.find((f) => f._id === foodId);
    const targetVariant = targetFood?.variants?.[variantIndex];
    const variantId = targetVariant?._id;

    try {
      setDeletingVariantKey(variantIdentifier);

      const response = await fetch(`${API_URL}/api/admin/delete-variant`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          foodId,
          variantId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data?.message || 'Failed to delete variant.');
      }

      setFoods((prevFoods) =>
        prevFoods.map((food) => {
          if (food._id === foodId) {
            if (data.variants) {
              return { ...food, variants: data.variants };
            }
            if (food.variants) {
              const updatedVariants = food.variants.filter((_, idx) => idx !== variantIndex);
              return { ...food, variants: updatedVariants };
            }
          }
          return food;
        })
      );

      Alert.alert("Success", data?.message || "Variant removed successfully.");
    } catch (error: any) {
      console.error("Delete variant error:", error);
      Alert.alert("Error", error?.message || "Failed to delete variant.");
    } finally {
      setDeletingVariantKey(null);
    }
  };

  const renderVariant = (variant: FoodVariant, index: number, foodId: string) => {
    const variantHasDiscount = hasDiscount(variant.price, variant.discountPrice);
    const finalPrice =
      variant.discountPrice !== null && variant.discountPrice !== undefined
        ? Number(variant.discountPrice)
        : Number(variant.price);
    const variantKey = variant._id || `${variant.name}-${index}`;
    const isDeletingThisVariant = deletingVariantKey === variantKey;

    return (
      <View key={variantKey} style={styles.variantCard}>
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

        <View style={styles.variantRightContainer}>
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

          <TouchableOpacity
            style={styles.variantDeleteBtn}
            onPress={() => handleDeleteVariant(foodId, variant, index)}
            disabled={isDeletingThisVariant}
            activeOpacity={0.7}
          >
            {isDeletingThisVariant ? (
              <ActivityIndicator size="small" color={COLORS.adminRed} />
            ) : (
              <Trash2 size={13} color={COLORS.adminRed} />
            )}
          </TouchableOpacity>
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
        <View style={styles.foodCardInner}>
          <View style={styles.foodImageContainer}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.foodImage} resizeMode="cover" />
            ) : (
              <View style={styles.noImage}>
                <UtensilsCrossed size={28} color={COLORS.textSecondary} />
              </View>
            )}

            <View
              style={[
                styles.availabilityBadge,
                { backgroundColor: food.isAvailable ? "#ECFDF5" : "#FEF2F2" },
              ]}
            >
              {food.isAvailable ? (
                <CircleCheck size={12} color={COLORS.success} />
              ) : (
                <CircleX size={12} color={COLORS.adminRed} />
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

          <View style={styles.foodContent}>
            <View style={styles.foodHeaderRow}>
              <Text style={styles.foodName} numberOfLines={1}>
                {food.name}
              </Text>
              
              <View style={styles.priceContainer}>
                {foodHasDiscount ? (
                  <View style={styles.priceRow}>
                    <Text style={styles.discountPrice}>{formatCurrency(foodFinalPrice)}</Text>
                    <Text style={styles.originalPrice}>{formatCurrency(food.price)}</Text>
                  </View>
                ) : (
                  <Text style={styles.normalPrice}>{formatCurrency(food.price)}</Text>
                )}
              </View>
            </View>

            {food.description ? (
              <Text style={styles.description} numberOfLines={2}>
                {food.description}
              </Text>
            ) : null}

            <View style={styles.metaRow}>
              {food.preparationTime ? (
                <View style={styles.metaBadge}>
                  <Clock size={11} color={COLORS.textSecondary} />
                  <Text style={styles.metaText}>{food.preparationTime} mins</Text>
                </View>
              ) : null}

              {food.isVegetarian ? (
                <View style={[styles.metaBadge, { backgroundColor: "#ECFDF5" }]}>
                  <Leaf size={11} color={COLORS.success} />
                  <Text style={[styles.metaText, { color: COLORS.success }]}>Vegetarian</Text>
                </View>
              ) : null}

              {food.isFeatured ? (
                <View style={[styles.metaBadge, { backgroundColor: "#FFF7ED" }]}>
                  <Sparkles size={11} color={COLORS.orange} />
                  <Text style={[styles.metaText, { color: COLORS.orange }]}>Featured</Text>
                </View>
              ) : null}
            </View>

            {hasVariants ? (
              <View style={styles.variantsSection}>
                <TouchableOpacity
                  style={styles.variantHeader}
                  onPress={() => toggleVariants(food._id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.variantHeaderLeft}>
                    <Text style={styles.variantHeaderTitle}>Food Variants</Text>
                    <View style={styles.variantHeaderCount}>
                      <Text style={styles.variantHeaderCountText}>{variants.length}</Text>
                    </View>
                  </View>
                  <View style={styles.variantHeaderRight}>
                    <Text style={styles.variantToggleText}>
                      {variantsExpanded ? "Hide Options" : "View Options"}
                    </Text>
                    {variantsExpanded ? (
                      <ChevronUp size={14} color={COLORS.text} />
                    ) : (
                      <ChevronDown size={14} color={COLORS.text} />
                    )}
                  </View>
                </TouchableOpacity>

                {variantsExpanded && (
                  <View style={styles.variantList}>
                    {variants.map((v, i) => renderVariant(v, i, food._id))}
                  </View>
                )}
              </View>
            ) : null}

            <View style={styles.cardFooter}>
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
                    <Trash2 size={14} color={COLORS.adminRed} />
                    <Text style={styles.deleteButtonText}>Delete Dish</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.adminBadgeIcon}>
            <ShieldCheck size={22} color="#34D399" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Food Management</Text>
            <Text style={styles.headerSubtitle}>Amar Adda Dashboard</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.headerRefreshButton}
          onPress={() => {
            fetchFoods(1, true, debouncedSearch);
            fetchStatistics();
          }}
          activeOpacity={0.7}
        >
          <RefreshCw size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <FlatList
          data={foods}
          renderItem={renderFoodCard}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContentContainer}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.text}
              colors={[COLORS.text]}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              {/* Statistic Cards Container */}
              <View style={styles.statsContainer}>
                <View style={styles.statsCard}>
                  <View style={[styles.statsIconBox, { backgroundColor: "#ECFDF5" }]}>
                    <ShoppingBag size={18} color={COLORS.success} />
                  </View>
                  <View style={styles.statsInfo}>
                    <Text style={styles.statsLabel}>Sold Today</Text>
                    {statsLoading ? (
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                      <Text style={styles.statsValue}>{stats.totalSoldToday}</Text>
                    )}
                  </View>
                </View>

                <View style={styles.statsCard}>
                  <View style={[styles.statsIconBox, { backgroundColor: "#FFF7ED" }]}>
                    <DollarSign size={18} color={COLORS.orange} />
                  </View>
                  <View style={styles.statsInfo}>
                    <Text style={styles.statsLabel}>Total Orders Today</Text>
                    {statsLoading ? (
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                      <Text style={styles.statsValue}>{stats.totalOrderToday}</Text>
                    )}
                  </View>
                </View>
              </View>

              {/* View Todays Sold Item List Button */}
              <TouchableOpacity
                style={styles.viewSoldBtn}
                onPress={handleViewTodaysSoldItems}
                activeOpacity={0.8}
              >
                <View style={styles.viewSoldBtnLeft}>
                  <TrendingUp size={18} color="#FFFFFF" />
                  <Text style={styles.viewSoldBtnText}>View Today's Sold Item List</Text>
                </View>
                <ChevronDown size={16} color="#FFFFFF" style={{ transform: [{ rotate: "-90deg" }] }} />
              </TouchableOpacity>

              <View style={[styles.listHeaderTitleRow, { marginTop: 10 }]}>
                <Text style={styles.sectionTitle}>Menu Catalog</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{foods.length} items loaded</Text>
                </View>
              </View>
              <Text style={styles.sectionSubtitle}>
                Manage menu listings, variants, pricing, and availability status.
              </Text>

              <View style={styles.searchContainer}>
                <Search size={18} color={COLORS.textSecondary} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search food by name..."
                  placeholderTextColor={COLORS.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery("")}
                    style={styles.clearSearchBtn}
                  >
                    <X size={16} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              {error ? (
                <View style={styles.errorCard}>
                  <CircleX size={20} color={COLORS.adminRed} />
                  <View style={styles.errorContent}>
                    <Text style={styles.errorTitle}>Error Loading Data</Text>
                    <Text style={styles.errorMessage}>{error}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => fetchFoods(1, false, debouncedSearch)}
                    style={styles.retryButton}
                  >
                    <Text style={styles.retryText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {loading && !refreshing && page === 1 ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={COLORS.text} />
                  <Text style={styles.loadingText}>Loading menu catalog...</Text>
                </View>
              ) : null}

              {!loading && !error && foods.length === 0 ? (
                <View style={styles.emptyCard}>
                  <View style={styles.emptyIcon}>
                    <UtensilsCrossed size={28} color={COLORS.textSecondary} />
                  </View>
                  <Text style={styles.emptyTitle}>No Foods Found</Text>
                  <Text style={styles.emptyText}>
                    {searchQuery
                      ? `No food items match "${searchQuery}"`
                      : "Your menu catalog is currently empty."}
                  </Text>
                </View>
              ) : null}
            </View>
          }
          ListFooterComponent={
            <View style={{ paddingVertical: 20 }}>
              {loadingMore && (
                <View style={styles.loadMoreIndicator}>
                  <ActivityIndicator size="small" color={COLORS.text} />
                  <Text style={styles.loadMoreText}>Loading more items...</Text>
                </View>
              )}
            </View>
          }
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
    paddingVertical: 16,
    backgroundColor: COLORS.primary,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  adminBadgeIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(52, 211, 153, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.3)",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "400",
    marginTop: 2,
  },
  headerRefreshButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.primary
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    overflow: "hidden",
  },
  listContentContainer: {
    paddingHorizontal: 16,
  },
  listHeader: {
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  statsCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statsIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  statsInfo: {
    flex: 1,
  },
  statsLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  statsValue: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: "800",
    marginTop: 2,
  },
  viewSoldBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  viewSoldBtnLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  viewSoldBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  listHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: -0.4,
  },
  countBadge: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: 14,
    fontWeight: "400",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "500",
  },
  clearSearchBtn: {
    padding: 4,
  },
  foodCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    overflow: "hidden",
  },
  foodCardDeleting: {
    opacity: 0.5,
  },
  foodCardInner: {
    flexDirection: "column",
  },
  foodImageContainer: {
    width: "100%",
    height: 180,
    backgroundColor: "#F1F5F9",
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
    backgroundColor: "#E2E8F0",
  },
  availabilityBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  availabilityText: {
    fontSize: 11,
    fontWeight: "700",
  },
  foodContent: {
    padding: 16,
  },
  foodHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  foodName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    flex: 1,
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  priceRow: {
    alignItems: "flex-end",
  },
  normalPrice: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },
  discountPrice: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.orange,
  },
  originalPrice: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.textSecondary,
    textDecorationLine: "line-through",
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  metaText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  variantsSection: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F8FAFC",
  },
  variantHeader: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#EEF2F6",
  },
  variantHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  variantHeaderTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
  },
  variantHeaderCount: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.text,
    alignItems: "center",
    justifyContent: "center",
  },
  variantHeaderCountText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  variantHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  variantToggleText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  variantList: {
    padding: 8,
    gap: 8,
  },
  variantCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  variantLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  variantNumber: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  variantNumberText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  variantInfo: {
    flex: 1,
  },
  variantName: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
  },
  variantPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  variantFinalPrice: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.orange,
  },
  variantOriginalPrice: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textDecorationLine: "line-through",
  },
  variantRightContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  variantAvailability: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  variantAvailabilityText: {
    fontSize: 9,
    fontWeight: "700",
  },
  variantDeleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  cardFooter: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  deleteButton: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#FEF2F2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.adminRed,
  },
  loadingContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingVertical: 40,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "500",
    marginTop: 10,
  },
  loadMoreIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
  },
  loadMoreText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
    marginBottom: 12,
    gap: 10,
  },
  errorContent: {
    flex: 1,
  },
  errorTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.adminRed,
  },
  errorMessage: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  retryButton: {
    backgroundColor: COLORS.adminRed,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
});