import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = Constants.expoConfig?.extra?.API_URL;

const COLORS = {
  primaryDark: "#0B3C29",
  emeraldGreen: "#34D399",
  adminRed: "#F43F5E",
  chefOrange: "#FF7A00",

  cardBg: "rgba(6, 40, 25, 0.82)",
  textMain: "#F8FAFC",
  textMuted: "#94A3B8",
  borderLight: "rgba(52, 211, 153, 0.2)",
};

type Role = "waiter" | "chef" | "admin";

export default function Login() {
  const router = useRouter();

  const [role, setRole] = useState<Role>("waiter");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secureText, setSecureText] = useState(true);
  const [error, setError] = useState("");

  const [focusedInput, setFocusedInput] = useState<
    "email" | "password" | null
  >(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(true);

  // --------------------------------------------------
  // CHECK SAVED USER
  // --------------------------------------------------
  useEffect(() => {
    const checkLoggedInUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("loggedInUser");

        if (!storedUser) {
          setIsCheckingUser(false);
          return;
        }

        const user = JSON.parse(storedUser);

        // Make sure stored data is actually valid
        if (
          user &&
          user.email &&
          user.role &&
          user.status === "active"
        ) {
          console.log("Logged in user found:", user.email);

          router.replace("/(app)");
          return;
        }

        // Invalid/old user data
        await AsyncStorage.removeItem("loggedInUser");
        setIsCheckingUser(false);
      } catch (error) {
        console.error("Check logged in user error:", error);

        // If stored data is corrupted, remove it
        await AsyncStorage.removeItem("loggedInUser");

        setIsCheckingUser(false);
      }
    };

    checkLoggedInUser();
  }, [router]);

  const getActiveColor = () => {
    switch (role) {
      case "admin":
        return COLORS.adminRed;

      case "chef":
        return COLORS.chefOrange;

      default:
        return COLORS.emeraldGreen;
    }
  };

  const activeColor = getActiveColor();

  const getRoleLabel = () => {
    switch (role) {
      case "admin":
        return "System Admin";

      case "chef":
        return "Chef";

      default:
        return "Waiter";
    }
  };

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    setError("");
  };

  // --------------------------------------------------
  // LOGIN
  // --------------------------------------------------
  const handleLogin = async () => {
    setError("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError("Please enter your email and password.");
      return;
    }

    if (!API_URL) {
      setError("API configuration is missing.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/admin/User/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: cleanEmail,
          password: cleanPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Invalid email or password.");
        return;
      }

      if (!data.user) {
        setError("Invalid server response. User information is missing.");
        return;
      }

      const loggedInUser = data.user;

      const userData = {
        name: loggedInUser.name,
        email: loggedInUser.email,
        phone: loggedInUser.phone,
        role: loggedInUser.role,
        status: loggedInUser.status,
      };

      // --------------------------------------------------
      // SAVE USER TO ASYNC STORAGE
      // --------------------------------------------------
      await AsyncStorage.setItem(
        "loggedInUser",
        JSON.stringify(userData)
      );

      console.log("User saved to AsyncStorage:", userData);

      // --------------------------------------------------
      // REDIRECT
      // --------------------------------------------------
      router.replace("/(app)");
    } catch (error) {
      console.error("Login error:", error);

      setError(
        "Unable to connect to the server. Please check your internet connection."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------------------------
  // CHECKING STORED USER
  // --------------------------------------------------
  if (isCheckingUser) {
    return (
      <View style={styles.checkingContainer}>
        <ActivityIndicator
          size="large"
          color={COLORS.emeraldGreen}
        />

        <Text style={styles.checkingText}>
          Checking login...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ImageBackground
        source={require("@/assets/images/login2.png")}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerSection} />

          {/* Role Selector */}
          <View style={styles.rolePickerContainer}>
            {/* Waiter */}
            <TouchableOpacity
              style={[
                styles.roleButton,
                role === "waiter" &&
                  styles.roleButtonActiveWaiter,
              ]}
              onPress={() => handleRoleChange("waiter")}
              activeOpacity={0.85}
            >
              <Ionicons
                name="restaurant-outline"
                size={17}
                color={
                  role === "waiter"
                    ? "#FFFFFF"
                    : COLORS.textMuted
                }
              />

              <Text
                style={[
                  styles.roleButtonText,
                  role === "waiter" &&
                    styles.roleButtonTextActive,
                ]}
              >
                Waiter
              </Text>
            </TouchableOpacity>

            {/* Chef */}
            <TouchableOpacity
              style={[
                styles.roleButton,
                role === "chef" &&
                  styles.roleButtonActiveChef,
              ]}
              onPress={() => handleRoleChange("chef")}
              activeOpacity={0.85}
            >
              <Ionicons
                name="flame-outline"
                size={17}
                color={
                  role === "chef"
                    ? "#FFFFFF"
                    : COLORS.textMuted
                }
              />

              <Text
                style={[
                  styles.roleButtonText,
                  role === "chef" &&
                    styles.roleButtonTextActive,
                ]}
              >
                Chef
              </Text>
            </TouchableOpacity>

            {/* Admin */}
            <TouchableOpacity
              style={[
                styles.roleButton,
                role === "admin" &&
                  styles.roleButtonActiveAdmin,
              ]}
              onPress={() => handleRoleChange("admin")}
              activeOpacity={0.85}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={17}
                color={
                  role === "admin"
                    ? "#FFFFFF"
                    : COLORS.textMuted
                }
              />

              <Text
                style={[
                  styles.roleButtonText,
                  role === "admin" &&
                    styles.roleButtonTextActive,
                ]}
              >
                Admin
              </Text>
            </TouchableOpacity>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
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

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Email Address
              </Text>

              <View
                style={[
                  styles.inputBox,
                  focusedInput === "email" && {
                    borderColor: activeColor,
                    backgroundColor:
                      "rgba(10, 50, 32, 0.95)",
                  },
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={
                    focusedInput === "email"
                      ? activeColor
                      : COLORS.textMuted
                  }
                  style={styles.inputIcon}
                />

                <TextInput
                  style={styles.textInput}
                  placeholder="staff@amaradda.com"
                  placeholderTextColor="#64748B"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedInput("email")}
                  onBlur={() => setFocusedInput(null)}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Security Password
              </Text>

              <View
                style={[
                  styles.inputBox,
                  focusedInput === "password" && {
                    borderColor: activeColor,
                    backgroundColor:
                      "rgba(10, 50, 32, 0.95)",
                  },
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={
                    focusedInput === "password"
                      ? activeColor
                      : COLORS.textMuted
                  }
                  style={styles.inputIcon}
                />

                <TextInput
                  style={styles.textInput}
                  placeholder="••••••••"
                  placeholderTextColor="#64748B"
                  secureTextEntry={secureText}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedInput("password")}
                  onBlur={() => setFocusedInput(null)}
                  onSubmitEditing={handleLogin}
                  returnKeyType="done"
                  editable={!isLoading}
                />

                <TouchableOpacity
                  onPress={() => setSecureText(!secureText)}
                  style={styles.eyeToggle}
                  disabled={isLoading}
                >
                  <Ionicons
                    name={
                      secureText
                        ? "eye-off-outline"
                        : "eye-outline"
                    }
                    size={18}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: activeColor,
                  opacity: isLoading ? 0.75 : 1,
                },
              ]}
              onPress={handleLogin}
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
                      {
                        color: "#FFFFFF",
                        marginLeft: 8,
                      },
                    ]}
                  >
                    Signing in...
                  </Text>
                </View>
              ) : (
                <View style={styles.submitContent}>
                  <Text style={styles.submitButtonText}>
                    Login as {getRoleLabel()}
                  </Text>

                  <Ionicons
                    name="arrow-forward-sharp"
                    size={16}
                    color="#FFFFFF"
                    style={{ marginLeft: 6 }}
                  />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  checkingContainer: {
    flex: 1,
    backgroundColor: COLORS.primaryDark,
    alignItems: "center",
    justifyContent: "center",
  },

  checkingText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
  },

  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(4, 30, 18, 0.35)",
  },

  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingVertical: 32,
  },

  headerSection: {
    alignItems: "center",
    marginBottom: 120,
  },

  rolePickerContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(4, 30, 18, 0.65)",
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.15)",
  },

  roleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    borderRadius: 10,
    gap: 5,
  },

  roleButtonActiveWaiter: {
    backgroundColor: COLORS.emeraldGreen,
    shadowColor: COLORS.emeraldGreen,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
  },

  roleButtonActiveChef: {
    backgroundColor: COLORS.chefOrange,
    shadowColor: COLORS.chefOrange,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
  },

  roleButtonActiveAdmin: {
    backgroundColor: COLORS.adminRed,
    shadowColor: COLORS.adminRed,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },

  roleButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },

  roleButtonTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  formContainer: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },

  errorAlertBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(244, 63, 94, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(244, 63, 94, 0.3)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },

  errorAlertText: {
    color: "#FDA4AF",
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },

  inputGroup: {
    marginBottom: 16,
  },

  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#CBD5E1",
    marginBottom: 6,
  },

  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(10, 45, 28, 0.6)",
    borderWidth: 1.2,
    borderColor: "rgba(52, 211, 153, 0.15)",
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
  },

  inputIcon: {
    marginRight: 10,
  },

  textInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    height: "100%",
    fontWeight: "500",
  },

  eyeToggle: {
    padding: 4,
  },

  submitButton: {
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },

  submitContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  submitButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: -0.1,
  },
});
