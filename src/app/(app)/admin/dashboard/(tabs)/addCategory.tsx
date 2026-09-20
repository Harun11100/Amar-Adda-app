import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Switch,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import Constants from "expo-constants";

const COLORS = {
  primary: "#0B3C29",
  background: "#F8FAF9",
  card: "#FFFFFF",
  textMain: "#0F172A",
  textMuted: "#64748B",
  borderLight: "#E2E8F0",
  accentOrange: "#FF7A00",
  successGreen: "#10B981",
  dangerRed: "#EF4444",
};

const API_URL = Constants.expoConfig?.extra?.API_URL;

interface Category {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export default function CreateCategoryScreen() {
  const router = useRouter();

  const [categoryName, setCategoryName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState("0");

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingCategories, setIsFetchingCategories] =
    useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  // Generate slug from category name
  const generateSlug = (name: string) => {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  // ==========================================
  // GET CATEGORIES
  // ==========================================
  const fetchCategories = async () => {
    try {
      setIsFetchingCategories(true);

      const response = await fetch(
        `${API_URL}/api/admin/category/getCategory`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || "Failed to fetch categories."
        );
      }

      setCategories(result.categories || []);
    } catch (err: any) {
      console.error("Fetch categories error:", err);

      setError(
        err?.message || "Failed to load categories."
      );
    } finally {
      setIsFetchingCategories(false);
    }
  };

  // Fetch whenever screen becomes focused
  useFocusEffect(
    useCallback(() => {
      fetchCategories();
    }, [])
  );

  // Pull to refresh
  const handleRefresh = async () => {
    setRefreshing(true);

    await fetchCategories();

    setRefreshing(false);
  };

  // ==========================================
  // CREATE CATEGORY
  // ==========================================
  const handleSubmit = async () => {
    setError("");

    const name = categoryName.trim();

    if (!name) {
      setError("Please enter a category name.");
      return;
    }

    const slug = generateSlug(name);

    if (!slug) {
      setError("Please enter a valid category name.");
      return;
    }

    const parsedSortOrder = Number(sortOrder);

    if (isNaN(parsedSortOrder) || parsedSortOrder < 0) {
      setError("Sort order must be a valid number.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/admin/category/createCategory`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            name,
            slug,
            isActive,
            sortOrder: parsedSortOrder,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message ||
            "Failed to create category. Please try again."
        );
      }

      // Clear form
      setCategoryName("");
      setSortOrder("0");
      setIsActive(true);

      // Refresh category list
      await fetchCategories();
    } catch (err: any) {
      setError(
        err?.message || "An unexpected error occurred."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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

        <Text style={styles.headerTitle}>
          Manage Categories
        </Text>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={fetchCategories}
          disabled={isFetchingCategories}
          activeOpacity={0.8}
        >
          <Ionicons
            name="refresh"
            size={20}
            color="#FFF"
          />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={
          Platform.OS === "ios" ? "padding" : "height"
        }
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
            />
          }
        >
          {/* Error */}
          {error ? (
            <View style={styles.errorAlertBox}>
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color={COLORS.dangerRed}
              />

              <Text style={styles.errorAlertText}>
                {error}
              </Text>

              <TouchableOpacity
                onPress={() => setError("")}
              >
                <Ionicons
                  name="close"
                  size={18}
                  color={COLORS.dangerRed}
                />
              </TouchableOpacity>
            </View>
          ) : null}

          {/* ==========================================
              CREATE CATEGORY
          ========================================== */}
          <View style={styles.formCard}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  Add New Category
                </Text>

                <Text style={styles.sectionSubtitle}>
                  Create a category for your food menu.
                </Text>
              </View>

              <View style={styles.sectionIcon}>
                <MaterialCommunityIcons
                  name="shape-plus"
                  size={22}
                  color={COLORS.primary}
                />
              </View>
            </View>

            {/* Category Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Category Name *
              </Text>

              <View style={styles.inputBox}>
                <MaterialCommunityIcons
                  name="format-title"
                  size={18}
                  color={COLORS.textMuted}
                  style={styles.inputIcon}
                />

                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Fast Food"
                  placeholderTextColor="#94A3B8"
                  value={categoryName}
                  onChangeText={setCategoryName}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Slug Preview */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Slug
              </Text>

              <View
                style={[
                  styles.inputBox,
                  styles.disabledInput,
                ]}
              >
                <MaterialCommunityIcons
                  name="link-variant"
                  size={18}
                  color={COLORS.textMuted}
                  style={styles.inputIcon}
                />

                <Text
                  style={[
                    styles.slugText,
                    !categoryName.trim() &&
                      styles.placeholderSlug,
                  ]}
                >
                  {categoryName.trim()
                    ? generateSlug(categoryName)
                    : "fast-food"}
                </Text>
              </View>

              <Text style={styles.helperText}>
                Automatically generated from the category
                name.
              </Text>
            </View>

            {/* Sort Order */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Sort Order
              </Text>

              <View style={styles.inputBox}>
                <MaterialCommunityIcons
                  name="sort-numeric-ascending"
                  size={18}
                  color={COLORS.textMuted}
                  style={styles.inputIcon}
                />

                <TextInput
                  style={styles.textInput}
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                  value={sortOrder}
                  onChangeText={setSortOrder}
                  keyboardType="numeric"
                  editable={!isLoading}
                />
              </View>

              <Text style={styles.helperText}>
                Lower numbers appear first in the menu.
              </Text>
            </View>

            {/* Active Status */}
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>
                  Active Status
                </Text>

                <Text style={styles.switchSubText}>
                  Active categories will be visible on the
                  customer menu.
                </Text>
              </View>

              <Switch
                trackColor={{
                  false: "#E2E8F0",
                  true: COLORS.successGreen,
                }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#E2E8F0"
                onValueChange={setIsActive}
                value={isActive}
                disabled={isLoading}
              />
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                isLoading &&
                  styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator
                  color="#FFFFFF"
                  size="small"
                />
              ) : (
                <View style={styles.submitContent}>
                  <Text style={styles.submitButtonText}>
                    Create Category
                  </Text>

                  <Ionicons
                    name="checkmark-circle-outline"
                    size={19}
                    color="#FFFFFF"
                    style={{ marginLeft: 8 }}
                  />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* ==========================================
              EXISTING CATEGORIES
          ========================================== */}
          <View style={styles.categoriesSection}>
            <View style={styles.categoriesHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  Categories
                </Text>

                <Text style={styles.sectionSubtitle}>
                  {categories.length}{" "}
                  {categories.length === 1
                    ? "category"
                    : "categories"}{" "}
                  available
                </Text>
              </View>

              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>
                  {categories.length}
                </Text>
              </View>
            </View>

            {isFetchingCategories &&
            categories.length === 0 ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator
                  size="small"
                  color={COLORS.primary}
                />

                <Text style={styles.loadingText}>
                  Loading categories...
                </Text>
              </View>
            ) : categories.length === 0 ? (
              <View style={styles.emptyBox}>
                <View style={styles.emptyIcon}>
                  <MaterialCommunityIcons
                    name="shape-outline"
                    size={30}
                    color={COLORS.textMuted}
                  />
                </View>

                <Text style={styles.emptyTitle}>
                  No categories yet
                </Text>

                <Text style={styles.emptyText}>
                  Create your first food category above.
                </Text>
              </View>
            ) : (
              <View style={styles.categoryList}>
                {categories.map((category, index) => (
                  <View
                    key={category._id}
                    style={styles.categoryCard}
                  >
                    {/* Number */}
                    <View style={styles.categoryNumber}>
                      <Text
                        style={styles.categoryNumberText}
                      >
                        {index + 1}
                      </Text>
                    </View>

                    {/* Category Info */}
                    <View
                      style={styles.categoryInfo}
                    >
                      <Text
                        style={styles.categoryName}
                        numberOfLines={1}
                      >
                        {category.name}
                      </Text>

                      <View
                        style={styles.categoryMeta}
                      >
                        <MaterialCommunityIcons
                          name="link-variant"
                          size={12}
                          color={COLORS.textMuted}
                        />

                        <Text
                          style={styles.categorySlug}
                          numberOfLines={1}
                        >
                          {category.slug}
                        </Text>

                        <Text style={styles.dot}>
                          •
                        </Text>

                        <Text
                          style={styles.sortText}
                        >
                          Order {category.sortOrder}
                        </Text>
                      </View>
                    </View>

                    {/* Status */}
                    <View
                      style={[
                        styles.statusBadge,
                        category.isActive
                          ? styles.activeBadge
                          : styles.inactiveBadge,
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor:
                              category.isActive
                                ? COLORS.successGreen
                                : COLORS.dangerRed,
                          },
                        ]}
                      />

                      <Text
                        style={[
                          styles.statusText,
                          {
                            color:
                              category.isActive
                                ? COLORS.successGreen
                                : COLORS.dangerRed,
                          },
                        ]}
                      >
                        {category.isActive
                          ? "Active"
                          : "Inactive"}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },

  refreshButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFF",
  },

  scrollContainer: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 30,
    flexGrow: 1,
  },

  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.textMain,
  },

  sectionSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 3,
    fontWeight: "500",
  },

  sectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },

  errorAlertBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF1F2",
    borderWidth: 1,
    borderColor: "#FECDD3",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },

  errorAlertText: {
    color: COLORS.dangerRed,
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },

  inputGroup: {
    marginBottom: 20,
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 8,
  },

  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1.2,
    borderColor: COLORS.borderLight,
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 14,
  },

  disabledInput: {
    backgroundColor: "#F1F5F9",
  },

  inputIcon: {
    marginRight: 10,
  },

  textInput: {
    flex: 1,
    color: COLORS.textMain,
    fontSize: 14,
    height: "100%",
    fontWeight: "500",
  },

  slugText: {
    flex: 1,
    color: COLORS.textMain,
    fontSize: 14,
    fontWeight: "500",
  },

  placeholderSlug: {
    color: "#94A3B8",
  },

  helperText: {
    marginTop: 6,
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "500",
  },

  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingTop: 4,
  },

  switchSubText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "500",
    paddingRight: 10,
  },

  submitButton: {
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },

  submitButtonDisabled: {
    opacity: 0.7,
  },

  submitContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  submitButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },

  categoriesSection: {
    marginTop: 24,
  },

  categoriesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  countBadge: {
    minWidth: 34,
    height: 30,
    paddingHorizontal: 9,
    borderRadius: 10,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },

  countBadgeText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "800",
  },

  categoryList: {
    gap: 10,
  },

  categoryCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 15,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  categoryNumber: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  categoryNumberText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.primary,
  },

  categoryInfo: {
    flex: 1,
    marginRight: 8,
  },

  categoryName: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.textMain,
  },

  categoryMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  categorySlug: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginLeft: 4,
    maxWidth: 100,
  },

  dot: {
    fontSize: 10,
    color: "#CBD5E1",
    marginHorizontal: 5,
  },

  sortText: {
    fontSize: 10,
    color: COLORS.textMuted,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },

  activeBadge: {
    backgroundColor: "#ECFDF5",
  },

  inactiveBadge: {
    backgroundColor: "#FEF2F2",
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },

  statusText: {
    fontSize: 9,
    fontWeight: "800",
  },

  loadingBox: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 15,
    paddingVertical: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "500",
  },

  emptyBox: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 15,
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: "center",
  },

  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.textMain,
  },

  emptyText: {
    marginTop: 4,
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: "center",
  },
});