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
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  RefreshCw,
  ShoppingBag,
  Clock,
  CircleX,
  Calendar,
  Trash2,
} from "lucide-react-native";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig?.extra?.API_URL;

const COLORS = {
  primary: "#0B3C29",
  emerald: "#059669",
  adminRed: "#DC2626",
  background: "#F8FAFC",
  card: "#FFFFFF",
  text: "#0F172A",
  textSecondary: "#64748B",
  border: "#E2E8F0",
  success: "#10B981",
};

type ItemSummary = {
  _id: string;
  foodName: string;
  variantName?: string | null;
  totalQuantity: number;
};

type FilterType = "today" | "7days";

export default function TodaysSoldItemsScreen({ navigation }: { navigation?: any }) {
  const [soldItems, setSoldItems] = useState<ItemSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>("today");
  const [totalQuantitySold, setTotalQuantitySold] = useState(0);
  const [error, setError] = useState("");

  const fetchSoldSummary = useCallback(async (filter: FilterType = "today") => {
    if (!API_URL) {
      setError("API configuration is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const endpoint = filter === "7days" ? "last-7-days-sold-items" : "today-sold-items";

      const response = await fetch(`${API_URL}/api/admin/stats/${endpoint}`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load summary.");
      }

      const items: ItemSummary[] = Array.isArray(data.items) ? data.items : [];
      setSoldItems(items);
      setTotalQuantitySold(
        data.totalQuantity || items.reduce((acc, curr) => acc + curr.totalQuantity, 0)
      );
    } catch (err: any) {
      console.error("Fetch summary error:", err);
      setError(err?.message || "Unable to load summary.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSoldSummary(activeFilter);
  }, [activeFilter, fetchSoldSummary]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSoldSummary(activeFilter);
  };

  const handleDeleteOldHistory = () => {
    Alert.alert(
      "Delete Old History",
      "Are you sure you want to delete all order history older than 7 days? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!API_URL) return;
            try {
              setDeleting(true);
              const response = await fetch(`${API_URL}/api/admin/stats/delete-old-orders`, {
                method: "DELETE",
                headers: { Accept: "application/json" },
              });
              const data = await response.json();

              if (!response.ok || !data.success) {
                throw new Error(data.message || "Failed to delete old orders.");
              }

              Alert.alert("Success", data.message || "Old order history deleted successfully.");
              fetchSoldSummary(activeFilter);
            } catch (err: any) {
              Alert.alert("Error", err?.message || "Something went wrong while deleting.");
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const renderItemCard = ({ item }: { item: ItemSummary }) => {
    return (
      <View style={styles.itemCard}>
        <View style={styles.itemTitleContainer}>
          <Text style={styles.foodName} numberOfLines={1}>
            {item.foodName}
          </Text>
          {item.variantName ? (
            <View style={styles.variantBadge}>
              <Text style={styles.variantBadgeText}>{item.variantName}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.quantityBadge}>
          <Text style={styles.quantityNumber}>{item.totalQuantity}</Text>
          <Text style={styles.quantityLabel}>Sold</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View>
            <Text style={styles.headerTitle}>
              {activeFilter === "today" ? "Today's Item Quantities" : "7 Days Item Quantities"}
            </Text>
            <Text style={styles.headerSubtitle}>Total sold per food item</Text>
          </View>
        </View>
        <View style={styles.headerRightButtons}>
          <TouchableOpacity
            style={styles.headerRefreshButton}
            onPress={handleDeleteOldHistory}
            activeOpacity={0.7}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Trash2 size={18} color={COLORS.adminRed} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerRefreshButton}
            onPress={() => fetchSoldSummary(activeFilter)}
            activeOpacity={0.7}
          >
            <RefreshCw size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.container}>
        <FlatList
          data={soldItems}
          renderItem={renderItemCard}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
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
              {/* Date Filter Tabs */}
              <View style={styles.filterTabContainer}>
                <TouchableOpacity
                  style={[styles.filterTab, activeFilter === "today" && styles.filterTabActive]}
                  onPress={() => setActiveFilter("today")}
                  activeOpacity={0.8}
                >
                  <Clock size={15} color={activeFilter === "today" ? "#FFFFFF" : COLORS.textSecondary} />
                  <Text style={[styles.filterTabText, activeFilter === "today" && styles.filterTabTextActive]}>
                    Today
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.filterTab, activeFilter === "7days" && styles.filterTabActive]}
                  onPress={() => setActiveFilter("7days")}
                  activeOpacity={0.8}
                >
                  <Calendar size={15} color={activeFilter === "7days" ? "#FFFFFF" : COLORS.textSecondary} />
                  <Text style={[styles.filterTabText, activeFilter === "7days" && styles.filterTabTextActive]}>
                    Last 7 Days
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Summary Total Card */}
              <View style={styles.summaryCard}>
                <View style={[styles.summaryIconBox, { backgroundColor: "#ECFDF5" }]}>
                  <ShoppingBag size={18} color={COLORS.success} />
                </View>
                <View style={styles.summaryInfo}>
                  <Text style={styles.summaryLabel}>Total Overall Quantity Sold</Text>
                  <Text style={styles.summaryValue}>{totalQuantitySold}</Text>
                </View>
              </View>

              {error ? (
                <View style={styles.errorCard}>
                  <CircleX size={20} color={COLORS.adminRed} />
                  <View style={styles.errorContent}>
                    <Text style={styles.errorTitle}>Error Loading Data</Text>
                    <Text style={styles.errorMessage}>{error}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => fetchSoldSummary(activeFilter)}
                    style={styles.retryButton}
                  >
                    <Text style={styles.retryText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={COLORS.text} />
                  <Text style={styles.loadingText}>Loading summary...</Text>
                </View>
              ) : null}

              {!loading && !error && soldItems.length === 0 ? (
                <View style={styles.emptyCard}>
                  <View style={styles.emptyIcon}>
                    <ShoppingBag size={28} color={COLORS.textSecondary} />
                  </View>
                  <Text style={styles.emptyTitle}>No Sales Recorded</Text>
                  <Text style={styles.emptyText}>
                    {activeFilter === "today"
                      ? "No food items have been sold today so far."
                      : "No food items have been sold in the last 7 days."}
                  </Text>
                </View>
              ) : null}
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.primary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.primary,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  headerRightButtons: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },
  headerSubtitle: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  headerRefreshButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    overflow: "hidden",
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 30 },
  filterTabContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  filterTabActive: { backgroundColor: COLORS.primary },
  filterTabText: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary },
  filterTabTextActive: { color: "#FFFFFF" },
  summaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  summaryIconBox: { width: 38, height: 38, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  summaryInfo: { flex: 1 },
  summaryLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: "600" },
  summaryValue: { fontSize: 16, color: COLORS.text, fontWeight: "800", marginTop: 2 },
  itemCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemTitleContainer: { flex: 1, flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6, marginRight: 12 },
  foodName: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  variantBadge: { backgroundColor: "#F1F5F9", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  variantBadgeText: { fontSize: 10, fontWeight: "600", color: COLORS.textSecondary },
  quantityBadge: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  quantityNumber: { fontSize: 15, fontWeight: "800", color: COLORS.success },
  quantityLabel: { fontSize: 9, fontWeight: "600", color: COLORS.textSecondary },
  loadingContainer: { backgroundColor: COLORS.card, borderRadius: 16, paddingVertical: 40, alignItems: "center", borderWidth: 1, borderColor: COLORS.border },
  loadingText: { fontSize: 13, color: COLORS.textSecondary, marginTop: 10 },
  emptyCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 32, alignItems: "center", borderWidth: 1, borderColor: COLORS.border },
  emptyIcon: { width: 54, height: 54, borderRadius: 16, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text, marginBottom: 4 },
  emptyText: { fontSize: 13, color: COLORS.textSecondary, textAlign: "center" },
  errorCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FEF2F2", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "rgba(239, 68, 68, 0.2)", marginBottom: 12, gap: 10 },
  errorContent: { flex: 1 },
  errorTitle: { fontSize: 13, fontWeight: "700", color: COLORS.adminRed },
  errorMessage: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  retryButton: { backgroundColor: COLORS.adminRed, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  retryText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
});