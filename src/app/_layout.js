// app/_layout.js
import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { useAuthStore } from "../store/authStore";

export default function RootLayout() {
  const { isAuthenticated, isHydrated, checkSavedSession } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // 1. Check for stored credentials on app startup
  useEffect(() => {
    checkSavedSession();
  }, []);

  // 2. Handle routing redirections when auth state or path switches
  useEffect(() => {
    // Prevent routing execution until AsyncStorage is completely parsed
    if (!isHydrated) return;

    // Check if the user is currently inside the (app) folder structure
    const inAppGroup = segments[0] === "(app)";

    if (isAuthenticated && !inAppGroup) {
      // User is verified -> Send them straight to the Dashboard layout group
      router.replace("/(app)");
    } else if (!isAuthenticated && inAppGroup) {
      // Session has expired or doesn't exist -> Bounce them to login screen
      router.replace("/(auth)/stuffLogin");
    }
  }, [isAuthenticated, isHydrated, segments]);

  // Render a native loading screen while checking storage to prevent visual flash
  if (!isHydrated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  // 3. Render the application routes
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(app)" options={{ headerShown: false }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
});