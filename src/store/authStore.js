import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isHydrated: false,
  isLoading: false,

  // Restore session when app starts
  checkSavedSession: async () => {
    try {
      const savedUser = await AsyncStorage.getItem("@user_session");

      if (savedUser) {
        set({
          user: JSON.parse(savedUser),
          isAuthenticated: true,
        });
      }
    } catch (error) {
      console.log("Session Restore Error:", error);
    } finally {
      set({
        isHydrated: true,
      });
    }
  },

  // Save authenticated user returned from backend
  login: async (userData) => {
    try {
      set({ isLoading: true });

      await AsyncStorage.setItem(
        "@user_session",
        JSON.stringify(userData)
      );

      set({
        user: userData,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.log("Login Error:", error);

      set({
        isLoading: false,
      });
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem("@user_session");

      set({
        user: null,
        isAuthenticated: false,
      });
    } catch (error) {
      console.log("Logout Error:", error);
    }
  },
}));