import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  UtensilsCrossed,
  Pizza,
  Soup,
  Drumstick,
  Cookie,
  Coffee,
  Cake,
  Plus,
  ChevronRight,
  User2,
  Clock3,
  MapPin,
  RefreshCw,
  Search,
  X,
  ShieldEllipsisIcon,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useAuthStore } from '../../../store/authStore'; // Update path as needed for your project structure

const { width } = Dimensions.get('window');

const API_URL = Constants.expoConfig?.extra?.API_URL;

const COLORS = {
  primary: '#0B3C29',
  primaryDark: '#062D20',
  primaryLight: '#EAF3EE',

  orange: '#FF7A00',
  orangeDark: '#E96500',
  orangeLight: '#FFF1E5',

  background: '#F7F8F7',
  card: '#FFFFFF',

  text: '#17221D',
  textSecondary: '#68736D',
  muted: '#9AA39E',

  border: '#E8ECE9',
  white: '#FFFFFF',

  success: '#2E9B63',
  danger: '#D64545',
};

type Food = {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  discountPrice?: number | null;
  image: string;
  isAvailable: boolean;
  isFeatured?: boolean;
  spicyLevel?: number;
  isVegetarian?: boolean;
  preparationTime?: number;
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Appetizers':
      return UtensilsCrossed;
    case 'Main Course':
      return Soup;
    case 'Fast Food':
      return Pizza;
    case 'Beverages':
      return Coffee;
    case 'Desserts':
      return Cake;
    case 'Snacks':
      return Cookie;
    case 'Specials':
      return Drumstick;
    default:
      return UtensilsCrossed;
  }
};

export default function HomeScreen() {
  const router = useRouter();

  // Pull user data and session restore methods from global authStore
  const user = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const checkSavedSession = useAuthStore((state) => state.checkSavedSession);

  const [foods, setFoods] = useState<Food[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkSavedSession();
  }, []);

  /*
   * ============================
   * FETCH FOOD ITEMS
   * ============================
   */
  const fetchFoods = async () => {
    try {
      setError('');

      const response = await fetch(`${API_URL}/api/admin/food/getFood`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || 'Failed to fetch food items'
        );
      }

      const foodData = Array.isArray(data)
        ? data
        : data.foods || data.data || [];

      setFoods(foodData);
    } catch (error: any) {
      console.error('Fetch foods error:', error);

      setError(
        error?.message || 'Unable to load food items'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  /*
   * ============================
   * REFRESH
   * ============================
   */
  const handleRefresh = () => {
    setRefreshing(true);
    fetchFoods();
  };

  /*
   * ============================
   * AVAILABLE FOODS
   * ============================
   */
  const availableFoods = useMemo(() => {
    return foods.filter((food) => food.isAvailable !== false);
  }, [foods]);

  /*
   * ============================
   * FILTER FOOD
   * ============================
   */
  const filteredFoods = useMemo(() => {
    let result = availableFoods;

    // Category filter
    if (selectedCategory !== 'All') {
      result = result.filter(
        (food) => food.category === selectedCategory
      );
    }

    // Search query filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (food) =>
          food.name.toLowerCase().includes(query) ||
          food.description.toLowerCase().includes(query) ||
          food.category.toLowerCase().includes(query)
      );
    }

    return result;
  }, [availableFoods, selectedCategory, searchQuery]);

  /*
   * ============================
   * PRICE
   * ============================
   */
  const getFoodPrice = (food: Food) => {
    if (
      food.discountPrice !== null &&
      food.discountPrice !== undefined &&
      food.discountPrice < food.price
    ) {
      return food.discountPrice;
    }

    return food.price;
  };

  const hasDiscount = (food: Food) => {
    return (
      food.discountPrice !== null &&
      food.discountPrice !== undefined &&
      food.discountPrice < food.price
    );
  };

  /*
   * ============================
   * LOADING
   * ============================
   */
  if (loading || !isHydrated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={COLORS.primary}
        />

        <View style={styles.loadingContainer}>
          <View style={styles.loadingIcon}>
            <UtensilsCrossed
              size={28}
              color={COLORS.white}
            />
          </View>

          <ActivityIndicator
            size="large"
            color={COLORS.orange}
            style={{ marginTop: 18 }}
          />

          <Text style={styles.loadingText}>
            Loading menu...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /*
   * ============================
   * MAIN PAGE
   * ============================
   */
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primary}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* ================= HEADER ================= */}

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logo}>
              <UtensilsCrossed
                size={19}
                color={COLORS.white}
              />
            </View>

            <View>
              <Text style={styles.brandTitle}>
                Amar Adda
              </Text>

              <Text style={styles.brandSubtitle}>
                Good Food • Good Mood
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            {user?.role === 'admin' && (
              <TouchableOpacity
                style={styles.adminDashboardButton}
                activeOpacity={0.75}
                onPress={() =>
                  router.navigate('/admin/dashboard')
                }
              >
                <ShieldEllipsisIcon
                  size={19}
                  color={COLORS.white}
                />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.profileButton}
              activeOpacity={0.75}
              onPress={() =>
                router.navigate('/profile')
              }
            >
              <User2
                size={19}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ================= WELCOME ================= */}

        <View style={styles.welcomeSection}>
          <View>
            <Text style={styles.welcomeSmall}>
              Hungry?
            </Text>

            <Text style={styles.welcomeTitle}>
              Find your perfect meal
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshButton}
            activeOpacity={0.75}
            onPress={handleRefresh}
          >
            <RefreshCw
              size={18}
              color={COLORS.primary}
            />
          </TouchableOpacity>
        </View>

        {/* ================= SEARCH BAR ================= */}

        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Search size={18} color={COLORS.muted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search dishes, ingredients..."
              placeholderTextColor={COLORS.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchButton}>
                <X size={16} color={COLORS.muted} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* ================= HERO ================= */}

        <View style={styles.heroCard}>
          <Image
            source={{
              uri:
                'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1200&auto=format&fit=crop',
            }}
            style={styles.heroImage}
          />

          <View style={styles.heroOverlay} />

          <View style={styles.heroContent}>
            <View style={styles.offerBadge}>
              <Text style={styles.offerBadgeText}>
                TODAY'S SPECIAL
              </Text>
            </View>

            <View>
              <Text style={styles.heroTitle}>
                Delicious food.
                {'\n'}
                <Text style={styles.heroAccent}>
                  Great moments.
                </Text>
              </Text>

              <Text style={styles.heroDescription}>
                Fresh ingredients, bold flavors and
                your favorite meals — all in one place.
              </Text>
            </View>

            <View style={styles.heroBottom}>
              <TouchableOpacity
                style={styles.tableButton}
                activeOpacity={0.8}
              >
                <MapPin
                  size={15}
                  color={COLORS.primary}
                />

                <Text style={styles.tableButtonText}>
                  Table 12
                </Text>

                <ChevronRight
                  size={15}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ================= FOOD SECTION ================= */}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              {searchQuery
                ? 'Search Results'
                : selectedCategory === 'All'
                ? 'Our Menu'
                : selectedCategory}
            </Text>

            <Text style={styles.sectionSubtitle}>
              {filteredFoods.length}{' '}
              {filteredFoods.length === 1
                ? 'item'
                : 'items'}{' '}
              available
            </Text>
          </View>
        </View>

        {/* ================= ERROR ================= */}

        {error ? (
          <View style={styles.messageCard}>
            <Text style={styles.messageTitle}>
              Couldn't load menu
            </Text>

            <Text style={styles.messageText}>
              {error}
            </Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRefresh}
              activeOpacity={0.8}
            >
              <RefreshCw
                size={16}
                color={COLORS.white}
              />

              <Text style={styles.retryButtonText}>
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ================= EMPTY ================= */}

        {!error && filteredFoods.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <UtensilsCrossed
                size={28}
                color={COLORS.primary}
              />
            </View>

            <Text style={styles.emptyTitle}>
              No food available
            </Text>

            <Text style={styles.emptyText}>
              {searchQuery
                ? `No dishes found matching "${searchQuery}"`
                : 'There are no food items in this category right now.'}
            </Text>
          </View>
        ) : null}

        {/* ================= FOOD CARDS ================= */}

        {!error &&
          filteredFoods.map((food) => {
            const price = getFoodPrice(food);
            const discounted = hasDiscount(food);

            return (
              <TouchableOpacity
                key={food._id}
                style={styles.foodCard}
                activeOpacity={0.92}
              >
                {/* IMAGE */}

                <View style={styles.foodImageWrapper}>
                  <Image
                    source={{ uri: food.image }}
                    style={styles.foodImage}
                  />

                  {food.isFeatured ? (
                    <View style={styles.featuredBadge}>
                      <Text
                        style={styles.featuredBadgeText}
                      >
                        FEATURED
                      </Text>
                    </View>
                  ) : null}

                  {food.isVegetarian ? (
                    <View style={styles.vegBadge}>
                      <View
                        style={styles.vegDot}
                      />

                      <Text style={styles.vegText}>
                        Veg
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* DETAILS */}

                <View style={styles.foodDetails}>
                  <View style={styles.foodTitleRow}>
                    <Text
                      style={styles.foodName}
                      numberOfLines={1}
                    >
                      {food.name}
                    </Text>

                    <TouchableOpacity
                      style={styles.addButton}
                      activeOpacity={0.8}
                    >
                      <Plus
                        size={18}
                        color={COLORS.white}
                        strokeWidth={2.5}
                      />
                    </TouchableOpacity>
                  </View>

                  <Text
                    style={styles.foodDescription}
                    numberOfLines={2}
                  >
                    {food.description}
                  </Text>

                  <View
                    style={styles.foodBottomRow}
                  >
                    <View>
                      <View
                        style={
                          styles.priceContainer
                        }
                      >
                        <Text
                          style={styles.foodPrice}
                        >
                          ৳{price}
                        </Text>

                        {discounted ? (
                          <Text
                            style={
                              styles.oldPrice
                            }
                          >
                            ৳{food.price}
                          </Text>
                        ) : null}
                      </View>
                    </View>

                    {food.preparationTime ? (
                      <View style={styles.timeRow}>
                        <Clock3
                          size={13}
                          color={COLORS.muted}
                        />

                        <Text
                          style={styles.timeText}
                        >
                          {food.preparationTime} min
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

        <View style={{ height: 35 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContainer: {
    paddingBottom: 20,
  },

  /* ================= HEADER ================= */

  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 22,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logo: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  brandTitle: {
    color: COLORS.white,
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.4,
  },

  brandSubtitle: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  adminDashboardButton: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: COLORS.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileButton: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ================= WELCOME ================= */

  welcomeSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 15,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  welcomeSmall: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: 3,
  },

  welcomeTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.7,
  },

  refreshButton: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ================= SEARCH ================= */

  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    height: 48,
  },

  searchIcon: {
    marginRight: 10,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },

  clearSearchButton: {
    padding: 4,
  },

  /* ================= HERO ================= */

  heroCard: {
    height: 245,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: COLORS.primary,
  },

  heroImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },

  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(4, 35, 24, 0.67)',
  },

  heroContent: {
    flex: 1,
    padding: 22,
    justifyContent: 'space-between',
  },

  offerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.orange,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  offerBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  heroTitle: {
    color: COLORS.white,
    fontSize: 27,
    lineHeight: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
  },

  heroAccent: {
    color: '#FFB56E',
  },

  heroDescription: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    lineHeight: 17,
    maxWidth: width * 0.7,
    marginTop: 7,
  },

  heroBottom: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  tableButton: {
    height: 39,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: COLORS.white,

    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  tableButtonText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
  },

  /* ================= SECTION ================= */

  sectionHeader: {
    marginHorizontal: 20,
    marginTop: 27,
    marginBottom: 14,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.3,
  },

  sectionSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 3,
  },

  /* ================= FOOD CARD ================= */

  foodCard: {
    marginHorizontal: 20,
    marginBottom: 13,
    padding: 10,

    backgroundColor: COLORS.white,
    borderRadius: 20,

    flexDirection: 'row',

    borderWidth: 1,
    borderColor: COLORS.border,
  },

  foodImageWrapper: {
    width: 116,
    height: 116,
    borderRadius: 15,
    overflow: 'hidden',
    position: 'relative',
  },

  foodImage: {
    width: '100%',
    height: '100%',
  },

  featuredBadge: {
    position: 'absolute',
    top: 7,
    left: 7,

    backgroundColor: COLORS.orange,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 7,
  },

  featuredBadgeText: {
    color: COLORS.white,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  vegBadge: {
    position: 'absolute',
    bottom: 7,
    left: 7,

    paddingHorizontal: 7,
    height: 22,
    borderRadius: 7,

    backgroundColor: COLORS.white,

    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  vegDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },

  vegText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.success,
  },

  foodDetails: {
    flex: 1,
    paddingLeft: 13,
    paddingVertical: 2,
  },

  foodTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  foodName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.3,
    marginRight: 8,
  },

  foodDescription: {
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.textSecondary,
    marginTop: 6,
    paddingRight: 4,
  },

  foodBottomRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },

  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  foodPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
  },

  oldPrice: {
    fontSize: 11,
    color: COLORS.muted,
    textDecorationLine: 'line-through',
    fontWeight: '600',
  },

  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  timeText: {
    fontSize: 10,
    color: COLORS.muted,
    fontWeight: '600',
  },

  addButton: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: COLORS.orange,

    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ================= LOADING ================= */

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },

  loadingIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: COLORS.primary,

    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },

  /* ================= ERROR ================= */

  messageCard: {
    marginHorizontal: 20,
    padding: 22,
    borderRadius: 20,
    backgroundColor: COLORS.white,

    borderWidth: 1,
    borderColor: COLORS.border,

    alignItems: 'center',
  },

  messageTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },

  messageText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },

  retryButton: {
    marginTop: 16,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.primary,

    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  retryButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },

  /* ================= EMPTY ================= */

  emptyCard: {
    marginHorizontal: 20,
    paddingVertical: 35,
    paddingHorizontal: 20,

    borderRadius: 20,
    backgroundColor: COLORS.white,

    borderWidth: 1,
    borderColor: COLORS.border,

    alignItems: 'center',
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,

    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },

  emptyText: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 17,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});