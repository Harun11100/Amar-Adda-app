import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Constants from "expo-constants";

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
  warning: "#F59E0B",
};

const API_URL = Constants.expoConfig?.extra?.API_URL;

type StaffRole = "waiter" | "chef" | "admin";
type StaffStatus = "active" | "inactive" | "suspended";

interface Staff {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
  status: StaffStatus;
  lastLogin?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export default function StaffListScreen() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  console.log(staffList, "staffList")
  /**
   * Fetch staff from backend
   */
  const fetchStaff = useCallback(async () => {
    try {
      setError("");

      if (!API_URL) {
        throw new Error("API URL is not configured.");
      }

      const response = await fetch(`${API_URL}/api/admin/User/getAllUsers`);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data?.message || "Failed to load staff members."
        );
      }

      setStaffList(Array.isArray(data.users) ? data.users : []);
    } catch (error: any) {
      console.error("Fetch staff error:", error);

      setError(
        error?.message || "Something went wrong while loading staff."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /**
   * Initial load
   */
  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  /**
   * Pull to refresh
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStaff();
  };

  /**
   * Delete Staff Handler
   */

const handleDeleteStaff = (staff: Staff) => {
  Alert.alert(
    "Delete Staff Member",
    `Are you sure you want to delete ${staff.name}? This action cannot be undone.`,
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            if (!API_URL) {
              throw new Error("API URL is not configured.");
            }

            // Your staff data uses `id`, not `_id`
            if (!staff.id) {
              throw new Error("Staff ID is missing.");
            }

            const response = await fetch(
              `${API_URL}/api/admin/User/deleteUser`,
              {
                method: "DELETE",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  userId: staff.id,
                }),
              }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
              throw new Error(
                data?.message || "Failed to delete staff member."
              );
            }

            // Remove deleted staff from local state
            setStaffList((prevList) =>
              prevList.filter((item) => item.id !== staff.id)
            );

            Alert.alert(
              "Success",
              data.message || "Staff member deleted successfully."
            );
          } catch (error: any) {
            console.error("Delete staff error:", error);

            Alert.alert(
              "Error",
              error?.message ||
                "Something went wrong while deleting staff."
            );
          }
        },
      },
    ]
  );
};



  /**
   * Search staff
   */
  const filteredStaff = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return staffList;
    }

    return staffList.filter((staff) => {
      return (
        staff.name?.toLowerCase().includes(query) ||
        staff.email?.toLowerCase().includes(query) ||
        staff.phone?.toLowerCase().includes(query) ||
        staff.role?.toLowerCase().includes(query) ||
        staff.status?.toLowerCase().includes(query) ||
        staff._id?.toLowerCase().includes(query)
      );
    });
  }, [staffList, searchQuery]);

  /**
   * Convert role to UI label
   */
  const getRoleLabel = (role: StaffRole) => {
    switch (role) {
      case "admin":
        return "Admin";

      case "chef":
        return "Chef";

      case "waiter":
        return "Waiter";

      default:
        return role;
    }
  };

  /**
   * Role colors
   */
  const getRoleColors = (role: StaffRole) => {
    switch (role) {
      case "admin":
        return {
          backgroundColor: "#FEF2F2",
          color: COLORS.adminRed,
        };

      case "chef":
        return {
          backgroundColor: "#FFF7ED",
          color: "#EA580C",
        };

      case "waiter":
        return {
          backgroundColor: "#F0F9FF",
          color: COLORS.staffBlue,
        };

      default:
        return {
          backgroundColor: "#F1F5F9",
          color: COLORS.textMuted,
        };
    }
  };

  /**
   * Status label
   */
  const getStatusLabel = (status: StaffStatus) => {
    switch (status) {
      case "active":
        return "Active";

      case "inactive":
        return "Inactive";

      case "suspended":
        return "Suspended";

      default:
        return status;
    }
  };

  /**
   * Status color
   */
  const getStatusColor = (status: StaffStatus) => {
    switch (status) {
      case "active":
        return COLORS.successGreen;

      case "suspended":
        return COLORS.adminRed;

      case "inactive":
        return COLORS.warning;

      default:
        return COLORS.textMuted;
    }
  };

  /**
   * Generate short staff ID
   */
  const getStaffId = (id: string) => {
    if (!id) return "N/A";

    return `STF-${id.slice(-5).toUpperCase()}`;
  };

  /**
   * Show staff details
   */
  const handleStaffDetails = (staff: Staff) => {
    Alert.alert(
      staff.name,
      `Role: ${getRoleLabel(staff.role)}\n\nEmail: ${
        staff.email
      }\n\nPhone: ${staff.phone}\n\nStatus: ${getStatusLabel(
        staff.status
      )}\n\nLast Login: ${
        staff.lastLogin
          ? new Date(staff.lastLogin).toLocaleString()
          : "Never"
      }`,
      [
        {
          text: "Close",
          style: "cancel",
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primary}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color="#FFF"
          />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            Staff Directory
          </Text>

          {!loading && (
            <Text style={styles.headerSubtitle}>
              {staffList.length}{" "}
              {staffList.length === 1 ? "member" : "members"}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.addButtonHeader}
          onPress={() =>
            router.push("/admin/register-staff" as any)
          }
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons
            name="search-outline"
            size={18}
            color={COLORS.textMuted}
            style={{ marginRight: 8 }}
          />

          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, role, phone..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              activeOpacity={0.7}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color="#94A3B8"
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Loading */}
        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator
              size="large"
              color={COLORS.primary}
            />

            <Text style={styles.loadingText}>
              Loading staff members...
            </Text>
          </View>
        ) : error ? (
          /* Error */
          <View style={styles.centerState}>
            <View style={styles.errorIcon}>
              <Ionicons
                name="cloud-offline-outline"
                size={34}
                color={COLORS.adminRed}
              />
            </View>

            <Text style={styles.errorTitle}>
              Unable to load staff
            </Text>

            <Text style={styles.errorText}>
              {error}
            </Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchStaff}
              activeOpacity={0.8}
            >
              <Ionicons
                name="refresh"
                size={17}
                color="#FFF"
              />

              <Text style={styles.retryButtonText}>
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Staff List */
          <ScrollView
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[COLORS.primary]}
                tintColor={COLORS.primary}
              />
            }
          >
            {/* Result count */}
            {staffList.length > 0 && (
              <View style={styles.resultHeader}>
                <Text style={styles.resultTitle}>
                  Staff Members
                </Text>

                <Text style={styles.resultCount}>
                  {filteredStaff.length}{" "}
                  {filteredStaff.length === 1
                    ? "result"
                    : "results"}
                </Text>
              </View>
            )}

            {filteredStaff.length === 0 ? (
              <View style={styles.emptyBox}>
                <View style={styles.emptyIconContainer}>
                  <MaterialCommunityIcons
                    name={
                      searchQuery
                        ? "account-search-outline"
                        : "account-group-outline"
                    }
                    size={42}
                    color={COLORS.textMuted}
                  />
                </View>

                <Text style={styles.emptyTitle}>
                  {searchQuery
                    ? "No staff found"
                    : "No staff members yet"}
                </Text>

                <Text style={styles.emptyText}>
                  {searchQuery
                    ? "Try searching with a different name, role, phone or email."
                    : "Add your first staff member to get started."}
                </Text>

                {!searchQuery && (
                  <TouchableOpacity
                    style={styles.emptyAddButton}
                    onPress={() =>
                      router.push(
                        "/admin/register-staff" as any
                      )
                    }
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="add"
                      size={17}
                      color="#FFF"
                    />

                    <Text
                      style={styles.emptyAddButtonText}
                    >
                      Add Staff
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              filteredStaff.map((staff) => {
                const roleColors = getRoleColors(
                  staff.role
                );

                const statusColor = getStatusColor(
                  staff.status
                );

                return (
                  <View
                    key={staff._id}
                    style={styles.staffCard}
                  >
                    {/* Top */}
                    <View style={styles.cardTopRow}>
                      {/* Avatar */}
                      <View
                        style={styles.avatarPlaceholder}
                      >
                        <Text style={styles.avatarText}>
                          {staff.name
                            ?.charAt(0)
                            ?.toUpperCase() || "?"}
                        </Text>
                      </View>

                      <View
                        style={{
                          flex: 1,
                          marginLeft: 12,
                        }}
                      >
                        <View style={styles.nameRow}>
                          <Text
                            style={styles.staffName}
                            numberOfLines={1}
                          >
                            {staff.name}
                          </Text>

                          <View
                            style={[
                              styles.roleBadge,
                              {
                                backgroundColor:
                                  roleColors.backgroundColor,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.roleBadgeText,
                                {
                                  color:
                                    roleColors.color,
                                },
                              ]}
                            >
                              {getRoleLabel(
                                staff.role
                              )}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.staffIdText}>
                          {getStaffId(staff._id)}
                        </Text>
                      </View>
                    </View>

                    {/* Details */}
                    <View
                      style={styles.cardDetailsSection}
                    >
                      <View style={styles.detailRow}>
                        <Ionicons
                          name="mail-outline"
                          size={14}
                          color={COLORS.textMuted}
                          style={{ marginRight: 6 }}
                        />

                        <Text
                          style={styles.detailText}
                          numberOfLines={1}
                        >
                          {staff.email}
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Ionicons
                          name="call-outline"
                          size={14}
                          color={COLORS.textMuted}
                          style={{ marginRight: 6 }}
                        />

                        <Text style={styles.detailText}>
                          {staff.phone}
                        </Text>
                      </View>
                    </View>

                    {/* Footer */}
                    <View style={styles.cardFooter}>
                      <View
                        style={
                          styles.statusIndicatorRow
                        }
                      >
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor:
                                statusColor,
                            },
                          ]}
                        />

                        <Text
                          style={styles.statusText}
                        >
                          {getStatusLabel(
                            staff.status
                          )}
                        </Text>
                      </View>

                      <View style={styles.cardActionsRow}>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          style={styles.deleteBtn}
                          onPress={() =>
                            handleDeleteStaff(staff)
                          }
                        >
                          <Ionicons
                            name="trash-outline"
                            size={14}
                            color={COLORS.adminRed}
                          />
                          <Text style={styles.deleteBtnText}>
                            Delete
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          activeOpacity={0.7}
                          style={styles.manageBtn}
                          onPress={() =>
                            handleStaffDetails(staff)
                          }
                        >
                          <Text
                            style={styles.manageBtnText}
                          >
                            Details
                          </Text>

                          <Ionicons
                            name="chevron-forward"
                            size={14}
                            color={COLORS.primary}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            )}

            <View style={{ height: 30 }} />
          </ScrollView>
        )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
  },

  headerCenter: {
    flex: 1,
    alignItems: "center",
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

  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFF",
  },

  headerSubtitle: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.65)",
  },

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

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textMain,
    fontWeight: "500",
  },

  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 2,
  },

  resultTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.textMain,
  },

  resultCount: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textMuted,
  },

  listContainer: {
    paddingBottom: 20,
  },

  staffCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },

  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#E8F1EC",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.primary,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
    gap: 8,
  },

  staffName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.textMain,
  },

  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },

  roleBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },

  staffIdText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "600",
  },

  cardDetailsSection: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    gap: 5,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  detailText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "500",
  },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 4,
  },

  statusIndicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textMain,
  },

  cardActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
  },

  deleteBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.adminRed,
  },

  manageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingVertical: 4,
  },

  manageBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingBottom: 80,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textMuted,
  },

  errorIcon: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  errorTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textMain,
  },

  errorText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textMuted,
    textAlign: "center",
  },

  retryButton: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
  },

  retryButtonText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
  },

  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    paddingHorizontal: 30,
  },

  emptyIconContainer: {
    width: 74,
    height: 74,
    borderRadius: 22,
    backgroundColor: "#EEF3F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textMain,
  },

  emptyText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textMuted,
    fontWeight: "500",
    textAlign: "center",
  },

  emptyAddButton: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
  },

  emptyAddButtonText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
  },
});