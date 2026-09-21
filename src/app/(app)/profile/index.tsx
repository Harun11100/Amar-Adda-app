import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Mail,
  Phone,
  BadgeInfo,
  LogOut,
  ChevronLeft,
  ShieldCheck,
} from 'lucide-react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/store/authStore';

const COLORS = {
  primary: '#0B3C29',
  primaryLight: '#E8F1EC',
  background: '#F5F7F6',
  card: '#FFFFFF',
  text: '#17221D',
  textSecondary: '#6C7771',
  border: '#E8ECE9',
  danger: '#D94747',
  dangerLight: '#FDF2F2',
};

type StaffProfile = {
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  staffId?: string;
  avatar?: string;
};

export default function StaffProfileScreen() {
  const [profile, setProfile] = useState<StaffProfile | null>(null);

  // Retrieve auth store logout or clear session function if available
  const logoutStore = useAuthStore((state: any) => state.logout || state.clearAuth || state.reset);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('loggedInUser');
        if (storedUser) {
          const parsedData = JSON.parse(storedUser);
          setProfile(parsedData);
        }
      } catch (error) {
        console.error('Failed to load user data from AsyncStorage:', error);
      }
    };

    loadUserData();
  }, []);

  const handleLogout = async () => {
    try {
      // Remove manual profile storage key
      await AsyncStorage.removeItem('loggedInUser');
      
      // Clear all related user session data from AsyncStorage
      await AsyncStorage.removeItem('auth-storage'); // Standard Zustand persist storage key
      await AsyncStorage.clear(); // Alternatively, clear storage or targeted keys if needed

      // Clear Zustand store session if function exists
      if (typeof logoutStore === 'function') {
        logoutStore();
      }
    } catch (error) {
      console.error('Failed to clear AsyncStorage and session on logout:', error);
    }
    router.push('/stuffLogin');
  };

  const isOnline = profile?.status?.toLowerCase() === 'active' || profile?.status === 'online';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primary}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <ChevronLeft color="#FFF" size={22} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Staff Profile</Text>

        <View style={styles.headerButtonPlaceholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            <Image
              source={require('@/assets/images/avatar.png')}
              style={styles.avatarImage}
            />

            <View
              style={[
                styles.onlineIndicator,
                { backgroundColor: isOnline ? '#22C55E' : '#9CA3AF' },
              ]}
            />
          </View>

          <Text style={styles.staffName}>{profile?.name || 'Staff Member'}</Text>

          <View style={styles.rolePill}>
            <ShieldCheck
              size={14}
              color={COLORS.primary}
            />

            <Text style={styles.roleText}>
              {profile?.role || 'Staff / Waiter'}
            </Text>
          </View>
        </View>

        {/* Personal Information */}
        
      
        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <View style={styles.logoutIcon}>
            <LogOut
              size={18}
              color={COLORS.danger}
            />
          </View>

          <Text style={styles.logoutButtonText}>
            Logout Session
          </Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
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
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: COLORS.primary,
  },

  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.10)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerButtonPlaceholder: {
    width: 40,
    height: 40,
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  content: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
  },

  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  /* Profile Card */

  profileCard: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 18,

    borderWidth: 1,
    borderColor: COLORS.border,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },

  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: COLORS.primaryLight,
  },

  onlineIndicator: {
    position: 'absolute',
    right: 2,
    bottom: 4,
    width: 17,
    height: 17,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: COLORS.card,
  },

  staffName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 7,
  },

  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 20,
  },

  roleText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },

  /* Information Card */

  sectionContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 18,

    borderWidth: 1,
    borderColor: COLORS.border,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },

  sectionIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 68,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F1',
  },

  lastInfoRow: {
    borderBottomWidth: 0,
  },

  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  infoContent: {
    flex: 1,
    minWidth: 0,
  },

  infoTitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 3,
  },

  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },

  /* Logout */

  logoutButton: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.dangerLight,

    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 16,
  },

  logoutIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  logoutButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.danger,
  },

  bottomSpacing: {
    height: 40,
  },
});