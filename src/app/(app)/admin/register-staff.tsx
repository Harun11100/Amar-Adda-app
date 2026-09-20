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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig?.extra?.API_URL;

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
  chefOrange: "#FF7A00",
};

type Role = "waiter" | "chef" | "admin";

export default function RegisterStaffScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("waiter");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async () => {
    setError("");
    setSuccess("");

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanPassword = password.trim();

    // Basic validation
    if (!cleanName || !cleanEmail || !cleanPhone || !cleanPassword) {
      setError("Please fill in all required profile fields.");
      return;
    }

    if (cleanPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (!API_URL) {
      setError("API configuration is missing.");
      return;
    }

    setIsLoading(true);

    const payload={
       name: cleanName,
            email: cleanEmail,
            phone: cleanPhone,
            password: cleanPassword,
            role,
    }

    console.log(payload)

    try {
      const response = await fetch(
        `${API_URL}/api/admin/User/addUser`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(
          result.message || "Failed to create staff account."
        );
        return;
      }

      setSuccess(
        result.message || "Staff account created successfully."
      );

      // Optional small delay so the success message can be seen
      setTimeout(() => {
        router.back();
      }, 700);
      
    } catch (err) {
      console.error("Register staff error:", err);

      setError(
        "Unable to connect to the server. Please check your internet connection."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleColor = () => {
    switch (role) {
      case "admin":
        return COLORS.adminRed;
      case "chef":
        return COLORS.chefOrange;
      default:
        return COLORS.staffBlue;
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
          New Staff Onboarding
        </Text>

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
          {/* Error */}
          {error ? (
            <View style={styles.errorAlertBox}>
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color={COLORS.adminRed}
              />

              <Text style={styles.errorAlertText}>
                {error}
              </Text>
            </View>
          ) : null}

          {/* Success */}
          {success ? (
            <View style={styles.successAlertBox}>
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color={COLORS.successGreen}
              />

              <Text style={styles.successAlertText}>
                {success}
              </Text>
            </View>
          ) : null}

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Role */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Assign Access Role *
              </Text>

              <View style={styles.rolePickerContainer}>
                {/* Waiter */}
                <TouchableOpacity
                  style={[
                    styles.roleTab,
                    role === "waiter" &&
                      styles.roleTabActiveWaiter,
                  ]}
                  onPress={() => {
                    setRole("waiter");
                    setError("");
                  }}
                  activeOpacity={0.8}
                  disabled={isLoading}
                >
                  <Ionicons
                    name="restaurant-outline"
                    size={16}
                    color={
                      role === "waiter"
                        ? "#FFF"
                        : COLORS.textMuted
                    }
                  />

                  <Text
                    style={[
                      styles.roleTabText,
                      role === "waiter" &&
                        styles.roleTabTextActive,
                    ]}
                  >
                    Waiter
                  </Text>
                </TouchableOpacity>

                {/* Chef */}
                <TouchableOpacity
                  style={[
                    styles.roleTab,
                    role === "chef" &&
                      styles.roleTabActiveChef,
                  ]}
                  onPress={() => {
                    setRole("chef");
                    setError("");
                  }}
                  activeOpacity={0.8}
                  disabled={isLoading}
                >
                  <Ionicons
                    name="flame-outline"
                    size={16}
                    color={
                      role === "chef"
                        ? "#FFF"
                        : COLORS.textMuted
                    }
                  />

                  <Text
                    style={[
                      styles.roleTabText,
                      role === "chef" &&
                        styles.roleTabTextActive,
                    ]}
                  >
                    Chef
                  </Text>
                </TouchableOpacity>

                {/* Admin */}
                <TouchableOpacity
                  style={[
                    styles.roleTab,
                    role === "admin" &&
                      styles.roleTabActiveAdmin,
                  ]}
                  onPress={() => {
                    setRole("admin");
                    setError("");
                  }}
                  activeOpacity={0.8}
                  disabled={isLoading}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={16}
                    color={
                      role === "admin"
                        ? "#FFF"
                        : COLORS.textMuted
                    }
                  />

                  <Text
                    style={[
                      styles.roleTabText,
                      role === "admin" &&
                        styles.roleTabTextActive,
                    ]}
                  >
                    Admin
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Full Name *
              </Text>

              <View style={styles.inputBox}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={COLORS.textMuted}
                  style={styles.inputIcon}
                />

                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Tanvir Ahmed"
                  placeholderTextColor="#94A3B8"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Email Address *
              </Text>

              <View style={styles.inputBox}>
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={COLORS.textMuted}
                  style={styles.inputIcon}
                />

                <TextInput
                  style={styles.textInput}
                  placeholder="staff@amaradda.com"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Phone Number *
              </Text>

              <View style={styles.inputBox}>
                <Ionicons
                  name="call-outline"
                  size={18}
                  color={COLORS.textMuted}
                  style={styles.inputIcon}
                />

                <TextInput
                  style={styles.textInput}
                  placeholder="+880 1700-000000"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Temporary Security Password *
              </Text>

              <View style={styles.inputBox}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={COLORS.textMuted}
                  style={styles.inputIcon}
                />

                <TextInput
                  style={styles.textInput}
                  placeholder="••••••••"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry
                  autoCapitalize="none"
                  value={password}
                  onChangeText={setPassword}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: getRoleColor(),
                  opacity: isLoading ? 0.7 : 1,
                },
              ]}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <View style={styles.submitContent}>
                  <ActivityIndicator
                    color="#FFFFFF"
                    size="small"
                  />

                  <Text
                    style={[
                      styles.submitButtonText,
                      { marginLeft: 8 },
                    ]}
                  >
                    Creating Account...
                  </Text>
                </View>
              ) : (
                <View style={styles.submitContent}>
                  <Text style={styles.submitButtonText}>
                    Create {role === "admin"
                      ? "Admin"
                      : role === "chef"
                      ? "Chef"
                      : "Waiter"}{" "}
                    Account
                  </Text>

                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color="#FFFFFF"
                    style={{ marginLeft: 6 }}
                  />
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
    color: COLORS.adminRed,
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },

  successAlertBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },

  successAlertText: {
    color: "#047857",
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },

  inputGroup: {
    marginBottom: 18,
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 8,
  },

  rolePickerContainer: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 4,
  },

  roleTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 5,
  },

  roleTabActiveWaiter: {
    backgroundColor: COLORS.staffBlue,
  },

  roleTabActiveChef: {
    backgroundColor: COLORS.chefOrange,
  },

  roleTabActiveAdmin: {
    backgroundColor: COLORS.adminRed,
  },

  roleTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textMuted,
  },

  roleTabTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
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

  submitButton: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 4,
    },
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