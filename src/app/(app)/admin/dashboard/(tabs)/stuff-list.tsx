import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const COLORS = {
  primary: "#0B3C29",
  background: "#F8FAF9",
  card: "#FFFFFF",
  textMain: "#0F172A",
  textMuted: "#64748B",
  borderLight: "#E2E8F0",
  successGreen: "#10B981",
  adminRed: "#F43F5E",
  staffBlue: "#0EA5E9",
};

// Mock staff data records
const initialStaffList = [
  { id: "STF-92041", name: "Harun Rashid", role: "Manager", email: "harun@amaradda.com", phone: "+880 1712-345678", status: "Active" },
  { id: "STF-92042", name: "Rahim Ahmed", role: "Chef", email: "rahim@amaradda.com", phone: "+880 1811-987654", status: "Active" },
  { id: "STF-92043", name: "Tanvir Hossain", role: "Waiter", email: "tanvir@amaradda.com", phone: "+880 1915-112233", status: "On Leave" },
];

export default function StaffListScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [staffList, setStaffList] = useState(initialStaffList);

  const filteredStaff = staffList.filter(
    (staff) =>
      staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={20} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Staff Directory</Text>
        <TouchableOpacity
          style={styles.addButtonHeader}
          onPress={() => router.push("/admin/register-staff" as any)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, role, or ID..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Staff List Scroll View */}
        <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
          {filteredStaff.length === 0 ? (
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons name="account-search-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No staff members found.</Text>
            </View>
          ) : (
            filteredStaff.map((staff) => (
              <View key={staff.id} style={styles.staffCard}>
                <View style={styles.cardTopRow}>
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>{staff.name.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={styles.nameRow}>
                      <Text style={styles.staffName}>{staff.name}</Text>
                      <View style={[
                        styles.roleBadge,
                        { backgroundColor: staff.role === "Manager" ? "#FEF2F2" : "#F0F9FF" }
                      ]}>
                        <Text style={[
                          styles.roleBadgeText,
                          { color: staff.role === "Manager" ? COLORS.adminRed : COLORS.staffBlue }
                        ]}>
                          {staff.role}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.staffIdText}>{staff.id}</Text>
                  </View>
                </View>

                <View style={styles.cardDetailsSection}>
                  <View style={styles.detailRow}>
                    <Ionicons name="mail-outline" size={14} color={COLORS.textMuted} style={{ marginRight: 6 }} />
                    <Text style={styles.detailText}>{staff.email}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="call-outline" size={14} color={COLORS.textMuted} style={{ marginRight: 6 }} />
                    <Text style={styles.detailText}>{staff.phone}</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.statusIndicatorRow}>
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: staff.status === "Active" ? COLORS.successGreen : "#F59E0B" }
                    ]} />
                    <Text style={styles.statusText}>{staff.status}</Text>
                  </View>
                  <TouchableOpacity activeOpacity={0.7} style={styles.manageBtn}>
                    <Text style={styles.manageBtnText}>Details</Text>
                    <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
          <View style={{ height: 30 }} />
        </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonHeader: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#FFF" },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1.2,
    borderColor: COLORS.borderLight,
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.textMain, fontWeight: "500" },
  listContainer: { paddingBottom: 20 },
  staffCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTopRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#E8F1EC",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 18, fontWeight: "800", color: COLORS.primary },
  nameRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 2 },
  staffName: { fontSize: 15, fontWeight: "800", color: COLORS.textMain },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  roleBadgeText: { fontSize: 11, fontWeight: "700" },
  staffIdText: { fontSize: 12, color: COLORS.textMuted, fontWeight: "600" },
  cardDetailsSection: { backgroundColor: "#F8FAFC", borderRadius: 10, padding: 10, marginBottom: 12, gap: 4 },
  detailRow: { flexDirection: "row", alignItems: "center" },
  detailText: { fontSize: 12, color: COLORS.textMuted, fontWeight: "500" },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 4 },
  statusIndicatorRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: "600", color: COLORS.textMain },
  manageBtn: { flexDirection: "row", alignItems: "center", gap: 2 },
  manageBtnText: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
  emptyBox: { alignItems: "center", justifyContent: "center", marginTop: 60 },
  emptyText: { marginTop: 10, fontSize: 14, color: COLORS.textMuted, fontWeight: "600" },
});