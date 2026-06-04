import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "../components/Icon";
import { AuthContext } from "../context/AuthContext";
import { SPACING, RADIUS, FONTS, SHADOWS } from "../config/theme";
import { useTheme } from "../context/ThemeContext";
import LocationService from "../services/LocationService";
import LocationPickerModal from "../components/LocationPickerModal";
import { AppButton, SurfaceCard, ScreenHeader } from "../components/SharedUI";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

const MENU = [
  {
    icon: "link-outline",
    label: "Link Accounts",
    subtitle: "Connect Blinkit, Zepto, etc.",
  },
  {
    icon: "help-circle-outline",
    label: "Help & Support",
    subtitle: "FAQ and contact",
  },
  {
    icon: "document-text-outline",
    label: "Terms & Conditions",
    subtitle: "Legal and privacy",
  },
];

const ProfileScreen = () => {
  const { user, logout } = useContext(AuthContext);
  const navigation = useNavigation();
  const { themeColors, isDark, toggleTheme } = useTheme();

  const [locationCity, setLocationCity] = useState("");
  const [locationPincode, setLocationPincode] = useState("");
  const [locationEditing, setLocationEditing] = useState(false);

  useEffect(() => {
    LocationService.init().then((loc) => {
      setLocationCity(loc.city || "");
      setLocationPincode(loc.pincode || "");
    });
  }, []);

  const saveLocation = async () => {
    if (!locationPincode || locationPincode.length < 5) {
      Alert.alert("Invalid Pincode", "Please enter a valid pincode.");
      return;
    }
    await LocationService.setLocation({
      latitude: LocationService.getLocation().latitude,
      longitude: LocationService.getLocation().longitude,
      city: locationCity,
      pincode: locationPincode,
    });
    setLocationEditing(false);
    Alert.alert(
      "Location Saved",
      "Your delivery location has been updated. New searches will use this location.",
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={{ paddingHorizontal: SPACING.xl, paddingTop: SPACING.xl }}>
            <ScreenHeader title="Profile" />
          </View>

          {/* User Info */}
          <View style={styles.userSection}>
            <View style={[styles.avatar, { backgroundColor: themeColors.primary, ...SHADOWS.glowSoft }]}>
              <Text style={styles.avatarText}>
                {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: themeColors.textPrimary }]}>{user?.name || "User"}</Text>
              <Text style={[styles.userEmail, { color: themeColors.textSecondary }]}>{user?.email || "No email provided"}</Text>
            </View>
          </View>

          {/* Location Settings */}
          <TouchableOpacity
            style={[styles.locationSection, { backgroundColor: themeColors.surface, ...SHADOWS.sm }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setLocationEditing(true);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.locationHeader}>
              <View style={[styles.locationIconWrap, { backgroundColor: themeColors.accentLight }]}>
                <Ionicons name="location" size={18} color={themeColors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.locationTitle, { color: themeColors.textPrimary }]}>Delivery Location</Text>
                <Text style={[styles.locationSubtitle, { color: themeColors.textSecondary }]}>
                  {locationCity || "Not set"} • {locationPincode || "—"}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={themeColors.textTertiary}
              />
            </View>
          </TouchableOpacity>

          <LocationPickerModal
            visible={locationEditing}
            onClose={() => setLocationEditing(false)}
            onSave={({ city, pincode }) => {
              setLocationCity(city);
              setLocationPincode(pincode);
            }}
          />

          {/* Settings Section */}
          <View style={styles.menuSection}>
            {/* Theme Toggle */}
            <View style={[styles.menuItem, { backgroundColor: themeColors.surface, ...SHADOWS.sm }]}>
              <Ionicons
                name={isDark ? "moon" : "sunny"}
                size={20}
                color={themeColors.primary}
              />
              <View style={styles.menuInfo}>
                <Text style={[styles.menuLabel, { color: themeColors.textPrimary }]}>Dark Mode</Text>
                <Text style={[styles.menuSubtitle, { color: themeColors.textSecondary }]}>Switch app theme</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={(val) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  toggleTheme(val ? "dark" : "light");
                }}
                trackColor={{ false: themeColors.border, true: themeColors.primary }}
                thumbColor={"#FFF"}
              />
            </View>

            {MENU.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.menuItem, { backgroundColor: themeColors.surface, ...SHADOWS.sm }]}
                activeOpacity={0.6}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (item.label === "Link Accounts") {
                    navigation.navigate("Accounts");
                  } else if (item.label === "Help & Support") {
                    navigation.navigate("SupportChat");
                  } else if (item.label === "Terms & Conditions") {
                    navigation.navigate("Terms");
                  }
                }}
              >
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={themeColors.textSecondary}
                />
                <View style={styles.menuInfo}>
                  <Text style={[styles.menuLabel, { color: themeColors.textPrimary }]}>{item.label}</Text>
                  <Text style={[styles.menuSubtitle, { color: themeColors.textSecondary }]}>{item.subtitle}</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={themeColors.textTertiary}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout */}
          <View style={{ marginHorizontal: SPACING.xl }}>
            <AppButton
              label="Sign Out"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                logout();
              }}
              variant="ghost"
              icon="log-out-outline"
              style={{ borderColor: themeColors.error, backgroundColor: themeColors.errorLight }}
              textStyle={{ color: themeColors.error }}
              testID="profileLogoutBtn"
            />
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
    gap: SPACING.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    ...FONTS.h2Dark,
    fontSize: 20,
    color: "#FFFFFF",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...FONTS.h3,
    marginBottom: 2,
  },
  userEmail: {
    ...FONTS.caption,
  },
  menuSection: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.xxl,
  },
  locationSection: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.xxl,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  locationIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  locationTitle: {
    ...FONTS.bodyBold,
  },
  locationSubtitle: {
    ...FONTS.caption,
    marginTop: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
    gap: SPACING.lg,
  },
  menuInfo: {
    flex: 1,
  },
  menuLabel: {
    ...FONTS.bodyBold,
    marginBottom: 2,
  },
  menuSubtitle: {
    ...FONTS.caption,
  },
});

export default ProfileScreen;
