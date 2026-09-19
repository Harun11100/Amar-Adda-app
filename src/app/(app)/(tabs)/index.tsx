import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ShoppingBag,
  Search,
  QrCode,
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
  Star,
  Clock3,
  MapPin,
  SlidersHorizontal,
  LayoutDashboard, // Added icon for Admin Dashboard
} from 'lucide-react-native';
import { useRouter } from 'expo-router';


const { width } = Dimensions.get('window');

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
};

const categories = [
  { id: '1', name: 'All', icon: UtensilsCrossed },
  { id: '2', name: 'Burgers', icon: UtensilsCrossed },
  { id: '3', name: 'Pizzas', icon: Pizza },
  { id: '4', name: 'Rice', icon: Soup },
  { id: '5', name: 'Chicken', icon: Drumstick },
  { id: '6', name: 'Snacks', icon: Cookie },
  { id: '7', name: 'Drinks', icon: Coffee },
  { id: '8', name: 'Desserts', icon: Cake },
];

const popularItems = [
  {
    id: '1',
    name: 'Chicken Burger',
    description: 'Juicy grilled chicken, fresh vegetables & special sauce.',
    price: '250',
    rating: '4.8',
    time: '15 min',
    image:
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=700&auto=format&fit=crop',
  },
  {
    id: '2',
    name: 'Cheese Pizza',
    description: 'Crispy crust topped with creamy cheese and herbs.',
    price: '420',
    rating: '4.9',
    time: '20 min',
    image:
      'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=700&auto=format&fit=crop',
  },
  {
    id: '3',
    name: 'Grilled Chicken',
    description: 'Tender grilled chicken served with fresh salad.',
    price: '350',
    rating: '4.7',
    time: '18 min',
    image:
      'https://images.unsplash.com/photo-1532550907401-a500c9a57435?q=80&w=700&auto=format&fit=crop',
  },
];

export default function HomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Simulated user role state. Change this to 'admin' to view the button, or connect to your Auth Context/API.
  const [userRole, setUserRole] = useState('admin'); // e.g., 'admin', 'staff', 'customer'

  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primary}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {/* ================= HEADER ================= */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logo}>
              <UtensilsCrossed size={19} color={COLORS.white} />
            </View>

            <View>
              <Text style={styles.brandTitle}>Amar Adda</Text>
              <Text style={styles.brandSubtitle}>Good Food • Good Mood</Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            {/* ADMIN DASHBOARD BUTTON: Visible ONLY when role === 'admin' */}
            {userRole === 'admin' && (
              <TouchableOpacity
                style={styles.adminDashboardButton}
                activeOpacity={0.75}
                onPress={() => router.navigate('/admin/dashboard')}
              >
                <LayoutDashboard size={19} color={COLORS.white} />
              </TouchableOpacity>
            )}

            {/* <TouchableOpacity
              style={styles.iconButton}
              activeOpacity={0.75}
            >
              <ShoppingBag size={20} color={COLORS.white} />

              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>2</Text>
              </View>
            </TouchableOpacity> */}

            <TouchableOpacity
              style={styles.profileButton}
              activeOpacity={0.75}
              onPress={() => router.navigate('/profile')}
            >
              <User2 size={19} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ================= WELCOME ================= */}
        <View style={styles.welcomeSection}>
          <View>
            <Text style={styles.welcomeSmall}>Hungry?</Text>
            <Text style={styles.welcomeTitle}>
              Find your perfect meal
            </Text>
          </View>
        </View>

  
        {/* ================= HERO ================= */}
        <View style={styles.heroCard}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1200&auto=format&fit=crop',
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

            <Text style={styles.heroTitle}>
              Delicious food.{'\n'}
              <Text style={styles.heroAccent}>
                Great moments.
              </Text>
            </Text>

            <Text style={styles.heroDescription}>
              Fresh ingredients, bold flavors and your favorite
              meals — all in one place.
            </Text>

            <View style={styles.heroBottom}>
              <TouchableOpacity
                style={styles.tableButton}
                activeOpacity={0.8}
              >
                <MapPin size={15} color={COLORS.primary} />

                <Text style={styles.tableButtonText}>
                  Table 12
                </Text>

                <ChevronRight
                  size={15}
                  color={COLORS.primary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.qrButton}
                activeOpacity={0.8}
              >
                <QrCode size={19} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ================= CATEGORIES ================= */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Categories</Text>
            <Text style={styles.sectionSubtitle}>
              What are you craving?
            </Text>
          </View>

          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.viewAllText}>View all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map((cat) => {
            const IconComponent = cat.icon;
            const isSelected =
              selectedCategory === cat.name;

            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryItem,
                  isSelected &&
                    styles.categoryItemActive,
                ]}
                onPress={() =>
                  setSelectedCategory(cat.name)
                }
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.categoryIcon,
                    isSelected &&
                      styles.categoryIconActive,
                  ]}
                >
                  <IconComponent
                    size={21}
                    color={
                      isSelected
                        ? COLORS.white
                        : COLORS.primary
                    }
                  />
                </View>

                <Text
                  style={[
                    styles.categoryName,
                    isSelected &&
                      styles.categoryNameActive,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ================= POPULAR ================= */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Popular right now
            </Text>
            <Text style={styles.sectionSubtitle}>
              Loved by our customers
            </Text>
          </View>

          <TouchableOpacity
            style={styles.seeAllButton}
            activeOpacity={0.7}
          >
            <Text style={styles.seeAllText}>See all</Text>
            <ChevronRight
              size={16}
              color={COLORS.orange}
            />
          </TouchableOpacity>
        </View>

        {/* ================= FOOD CARDS ================= */}
        {popularItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.foodCard}
            activeOpacity={0.92}
          >
            <View style={styles.foodImageWrapper}>
              <Image
                source={{ uri: item.image }}
                style={styles.foodImage}
              />

              <View style={styles.ratingBadge}>
                <Star
                  size={12}
                  color={COLORS.orange}
                  fill={COLORS.orange}
                />
                <Text style={styles.ratingText}>
                  {item.rating}
                </Text>
              </View>
            </View>

            <View style={styles.foodDetails}>
              <View style={styles.foodTitleRow}>
                <Text style={styles.foodName}>
                  {item.name}
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
                {item.description}
              </Text>

              <View style={styles.foodBottomRow}>
                <Text style={styles.foodPrice}>
                  ৳{item.price}
                </Text>

                <View style={styles.timeRow}>
                  <Clock3
                    size={13}
                    color={COLORS.muted}
                  />
                  <Text style={styles.timeText}>
                    {item.time}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* ================= BOTTOM SPACE ================= */}
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

  /* HEADER */
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
    backgroundColor: COLORS.orange, // Distinct color to stand out for admins
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconButton: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.11)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  profileButton: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: COLORS.orange,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },

  cartBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '800',
  },

  /* WELCOME */
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

  filterButton: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* SEARCH */
  searchContainer: {
    height: 53,
    marginHorizontal: 20,
    marginBottom: 18,
    paddingHorizontal: 16,

    backgroundColor: COLORS.white,
    borderRadius: 17,

    flexDirection: 'row',
    alignItems: 'center',

    borderWidth: 1,
    borderColor: COLORS.border,
  },

  searchInput: {
    flex: 1,
    marginLeft: 11,
    fontSize: 14,
    color: COLORS.text,
    paddingVertical: 0,
  },

  clearText: {
    fontSize: 22,
    color: COLORS.muted,
    paddingLeft: 8,
  },

  /* HERO */
  heroCard: {
    height: 245,
    marginHorizontal: 20,
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
  },

  heroBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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

  qrButton: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* SECTIONS */
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

  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.orange,
  },

  /* CATEGORIES */
  categoriesContainer: {
    paddingHorizontal: 20,
    gap: 10,
  },

  categoryItem: {
    width: 76,
    height: 88,
    borderRadius: 17,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  categoryItemActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  categoryIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
  },

  categoryIconActive: {
    backgroundColor: 'rgba(255,255,255,0.13)',
  },

  categoryName: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },

  categoryNameActive: {
    color: COLORS.white,
  },

  /* POPULAR */
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },

  seeAllText: {
    color: COLORS.orange,
    fontSize: 12,
    fontWeight: '700',
  },

  /* FOOD CARD */
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

  ratingBadge: {
    position: 'absolute',
    top: 7,
    left: 7,

    paddingHorizontal: 7,
    height: 24,
    borderRadius: 8,

    backgroundColor: COLORS.white,

    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },

  ratingText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.text,
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

  foodPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
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
});