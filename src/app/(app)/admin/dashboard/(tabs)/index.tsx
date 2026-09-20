import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  ShieldCheck,
  Menu,
  LogOut,
  RefreshCw,
} from 'lucide-react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#0B3C29',
  adminRed: '#F43F5E',
  background: '#F8FAF9',
  card: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  success: '#10B981',
  warning: '#F59E0B',
};

const API_URL = Constants.expoConfig?.extra?.API_URL;

type SalesData = {
  date: string;
  totalSales: number;
};

export default function AdminDashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [loadingSales, setLoadingSales] = useState(true);
  const [salesError, setSalesError] = useState('');
  const [sales, setSales] = useState<SalesData>({
    date: '',
    totalSales: 0,
  });

  const fetchTodaySales = useCallback(async () => {
    try {
      setSalesError('');

      const response = await fetch(`${API_URL}/api/admin/sales/today`);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load today's sales."
        );
      }

      setSales({
        date: data.date,
        totalSales: Number(data.totalSales) || 0,
      });
    } catch (error: any) {
      console.error('Fetch today sales error:', error);

      setSalesError(
        error?.message || "Couldn't load today's sales."
      );
    } finally {
      setLoadingSales(false);
    }
  }, []);

  useEffect(() => {
    fetchTodaySales();
  }, [fetchTodaySales]);


  useEffect(() => {
    const interval = setInterval(() => {
      fetchTodaySales();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchTodaySales]);

  // --------------------------------------------------
  // PULL TO REFRESH
  // --------------------------------------------------

  const handleRefresh = async () => {
    setRefreshing(true);

    await fetchTodaySales();

    setRefreshing(false);
  };

  // --------------------------------------------------
  // FORMAT CURRENCY
  // --------------------------------------------------

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString('en-BD')}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primary}
      />

      {/* --------------------------------------------- */}
      {/* ADMIN HEADER */}
      {/* --------------------------------------------- */}

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.adminBadgeIcon}>
            <ShieldCheck size={18} color="#FFF" />
          </View>

          <View>
            <Text style={styles.headerTitle}>
              Admin Control Hub
            </Text>

            <Text style={styles.headerSubtitle}>
              Amar Adda Management
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.profileIconButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <LogOut size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* --------------------------------------------- */}
        {/* KPI / METRIC CARDS */}
        {/* --------------------------------------------- */}

        <View style={styles.metricsGrid}>
          {/* TODAY'S REVENUE */}

          <View style={styles.metricCard}>
            <View
              style={[
                styles.metricIconBox,
                { backgroundColor: '#EFF6FF' },
              ]}
            >
              <DollarSign size={20} color="#2563EB" />
            </View>

            {loadingSales ? (
              <ActivityIndicator
                size="small"
                color={COLORS.primary}
                style={styles.salesLoader}
              />
            ) : (
              <Text style={styles.metricValue}>
                {formatCurrency(sales.totalSales)}
              </Text>
            )}

            <Text style={styles.metricLabel}>
              Today's Revenue
            </Text>

            {salesError ? (
              <TouchableOpacity
                style={styles.retryRow}
                onPress={fetchTodaySales}
                activeOpacity={0.7}
              >
                <RefreshCw
                  size={12}
                  color={COLORS.adminRed}
                />

                <Text style={styles.errorText}>
                  Retry
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.trendRow}>
                <TrendingUp
                  size={12}
                  color={COLORS.success}
                />

                <Text style={styles.trendText}>
                  Today's total sales
                </Text>
              </View>
            )}
          </View>

          {/* ACTIVE ORDERS */}

          <View style={styles.metricCard}>
            <View
              style={[
                styles.metricIconBox,
                { backgroundColor: '#FFF7ED' },
              ]}
            >
              <ShoppingBag
                size={20}
                color={COLORS.warning}
              />
            </View>

            <Text style={styles.metricValue}>
              —
            </Text>

            <Text style={styles.metricLabel}>
              Active Orders
            </Text>

            <View style={styles.trendRow}>
              <Clock
                size={12}
                color={COLORS.warning}
              />

              <Text style={styles.trendText}>
                Kitchen orders
              </Text>
            </View>
          </View>
        </View>

        {/* --------------------------------------------- */}
        {/* SECONDARY METRICS */}
        {/* --------------------------------------------- */}

        <View style={styles.secondaryMetricsRow}>
          <View style={styles.smallMetricCard}>
            <Users
              size={16}
              color={COLORS.primary}
              style={{ marginBottom: 4 }}
            />

            <Text style={styles.smallMetricVal}>
              —
            </Text>

            <Text style={styles.smallMetricLbl}>
              Staff On Duty
            </Text>
          </View>

          <View style={styles.smallMetricCard}>
            <LayoutDashboard
              size={16}
              color="#8B5CF6"
              style={{ marginBottom: 4 }}
            />

            <Text style={styles.smallMetricVal}>
              —
            </Text>

            <Text style={styles.smallMetricLbl}>
              Tables Occupied
            </Text>
          </View>
        </View>

        {/* --------------------------------------------- */}
        {/* QUICK MANAGEMENT */}
        {/* --------------------------------------------- */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Quick Management
          </Text>
        </View>

        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.8}
          >
            <ShoppingBag
              size={20}
              color={COLORS.primary}
            />

            <Text style={styles.actionText}>
              Manage Menu
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.8}
          >
            <Users
              size={20}
              color={COLORS.primary}
            />

            <Text style={styles.actionText}>
              Staff Directory
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.8}
          >
            <TrendingUp
              size={20}
              color={COLORS.primary}
            />

            <Text style={styles.actionText}>
              Sales Reports
            </Text>
          </TouchableOpacity>
        </View>

        {/* --------------------------------------------- */}
        {/* TODAY'S SALES INFORMATION */}
        {/* --------------------------------------------- */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Today's Sales
          </Text>

          <TouchableOpacity
            onPress={fetchTodaySales}
            activeOpacity={0.7}
          >
            <RefreshCw
              size={16}
              color={COLORS.primary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.salesCard}>
          <View style={styles.salesCardLeft}>
            <View style={styles.salesIcon}>
              <DollarSign
                size={22}
                color={COLORS.success}
              />
            </View>

            <View>
              <Text style={styles.salesTitle}>
                Total Sales
              </Text>

              <Text style={styles.salesDate}>
                {sales.date || 'Today'}
              </Text>
            </View>
          </View>

          {loadingSales ? (
            <ActivityIndicator
              size="small"
              color={COLORS.primary}
            />
          ) : (
            <Text style={styles.salesAmount}>
              {formatCurrency(sales.totalSales)}
            </Text>
          )}
        </View>

        {/* --------------------------------------------- */}
        {/* NO LIVE ORDERS MESSAGE */}
        {/* --------------------------------------------- */}

        <View style={styles.emptyOrdersCard}>
          <View style={styles.emptyIcon}>
            <Menu
              size={24}
              color={COLORS.primary}
            />
          </View>

          <Text style={styles.emptyOrdersTitle}>
            Order history is archived
          </Text>

          <Text style={styles.emptyOrdersText}>
            Completed orders are removed after payment.
            Daily revenue is stored separately in sales records.
          </Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  adminBadgeIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(244, 63, 94, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.4)',
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
  },

  headerSubtitle: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '500',
  },

  profileIconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  scrollContainer: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 16,
    flexGrow: 1,
  },

  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  metricCard: {
    width: (width - 40) / 2,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },

  metricIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },

  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 2,
  },

  metricLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 8,
  },

  salesLoader: {
    height: 22,
    alignSelf: 'flex-start',
    marginBottom: 2,
  },

  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  trendText: {
    fontSize: 10,
    color: COLORS.success,
    fontWeight: '700',
    marginLeft: 3,
  },

  retryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  errorText: {
    fontSize: 10,
    color: COLORS.adminRed,
    fontWeight: '700',
    marginLeft: 4,
  },

  secondaryMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  smallMetricCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  smallMetricVal: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 1,
  },

  smallMetricLbl: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },

  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  actionButton: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  actionText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 6,
  },

  salesCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  salesCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  salesIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  salesTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },

  salesDate: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  salesAmount: {
    fontSize: 19,
    fontWeight: '900',
    color: COLORS.primary,
  },

  emptyOrdersCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 4,
  },

  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  emptyOrdersTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 5,
  },

  emptyOrdersText: {
    fontSize: 11,
    lineHeight: 17,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
