import React, { useState } from "react";
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
  accentOrange: "#FF7A00",
  successGreen: "#10B981",
  dangerRed: "#EF4444",
};

export default function CreateCategoryScreen() {
  const router = useRouter();
  
  const [categoryName, setCategoryName] = useState("");
  const [subCategoryInput, setSubCategoryInput] = useState("");
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Add a subcategory item to the list
  const handleAddSubCategory = () => {
    if (!subCategoryInput.trim()) return;
    if (subCategories.includes(subCategoryInput.trim())) {
      setError("This subcategory is already added.");
      return;
    }
    setSubCategories([...subCategories, subCategoryInput.trim()]);
    setSubCategoryInput("");
    setError("");
  };

  // Remove a subcategory item from the list
  const handleRemoveSubCategory = (indexToRemove: number) => {
    setSubCategories(subCategories.filter((_, index) => index !== indexToRemove));
  };

  // Handle final form submission
  const handleSubmit = async () => {
    setError("");
    if (!categoryName.trim()) {
      setError("Please enter a category name.");
      return;
    }

    setIsLoading(true);
    const BACKEND_URL = "https://abdur-rahman-shoes-web-app.vercel.app/api/categories"; // Update with your actual endpoint

    try {
      const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: categoryName.trim(),
          subCategories: subCategories,
          isActive: isActive,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Failed to upload category. Please try again.");
      }

      // Success - navigate back or reset form
      router.back();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={20} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Category</Text>
        <View style={{ width: 38 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {error ? (
            <View style={styles.errorAlertBox}>
              <Ionicons name="alert-circle-outline" size={18} color={COLORS.dangerRed} />
              <Text style={styles.errorAlertText}>{error}</Text>
            </View>
          ) : null}

          {/* Form Card Wrapper */}
          <View style={styles.formCard}>
            
            {/* Category Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category Name *</Text>
              <View style={styles.inputBox}>
                <MaterialCommunityIcons name="format-title" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Fast Food, Beverages, Desserts"
                  placeholderTextColor="#94A3B8"
                  value={categoryName}
                  onChangeText={setCategoryName}
                />
              </View>
            </View>

            {/* Subcategories Dynamic Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Subcategories</Text>
              <View style={styles.subCategoryRow}>
                <View style={[styles.inputBox, { flex: 1, marginBottom: 0 }]}>
                  <Ionicons name="list-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Burgers, Pizzas"
                    placeholderTextColor="#94A3B8"
                    value={subCategoryInput}
                    onChangeText={setSubCategoryInput}
                    onSubmitEditing={handleAddSubCategory}
                  />
                </View>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleAddSubCategory}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={22} color="#FFF" />
                </TouchableOpacity>
              </View>

              {/* Render Added Subcategories Chips */}
              {subCategories.length > 0 && (
                <View style={styles.chipsContainer}>
                  {subCategories.map((sub, index) => (
                    <View key={index} style={styles.chip}>
                      <Text style={styles.chipText}>{sub}</Text>
                      <TouchableOpacity onPress={() => handleRemoveSubCategory(index)}>
                        <Ionicons name="close-circle" size={16} color={COLORS.textMuted} style={{ marginLeft: 6 }} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Status Switcher */}
            <View style={styles.switchRow}>
              <View>
                <Text style={styles.inputLabel}>Active Status</Text>
                <Text style={styles.switchSubText}>Visible instantly on customer POS/Menu</Text>
              </View>
              <Switch
                trackColor={{ false: "#E2E8F0", true: COLORS.successGreen }}
                thumbColor={"#FFFFFF"}
                ios_backgroundColor="#E2E8F0"
                onValueChange={setIsActive}
                value={isActive}
              />
            </View>

            {/* Submit Action Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.submitContent}>
                  <Text style={styles.submitButtonText}>Upload Category</Text>
                  <Ionicons name="cloud-upload-outline" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
                </View>
              )}
            </TouchableOpacity>

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
    flexGrow: 1,
  },
  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 30,
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
  subCategoryRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  addButton: {
    backgroundColor: COLORS.primary,
    height: 50,
    width: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textMain,
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
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
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
});