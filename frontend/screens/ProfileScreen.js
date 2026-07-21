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
    icon: "link",
    label: "Linked accounts",
    subtitle: "Blinkit, Zepto & 3 more",
    color: "coriander",
  },
  {
    icon: "help",
    label: "Help & support",
    subtitle: "FAQ and contact",
    color: "turmeric",
  },
  {
    icon: "document-text",
    label: "Terms & conditions",
    subtitle: "Legal and privacy",
    color: "ink",
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
      <View style={[styles.container, { backgroundColor: themeColors.paper }]}>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={{ paddingHorizontal: SPACING.xl, paddingTop: SPACING.xl, marginBottom: 18 }}>
            <Text style={[FONTS.heading, { fontSize: 24, color: themeColors.ink }]}>Profile</Text>
          </View>

          {/* User Info */}
          <View style={styles.userSection}>
            <View style={[styles.avatar, { backgroundColor: themeColors.aubergine }]}>
              <Text style={[FONTS.heading, { fontSize: 22, color: "#fff" }]}>
                {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={[FONTS.uiBodyBold, { fontSize: 16, color: themeColors.ink }]}>{user?.name || "User"}</Text>
              <Text style={[FONTS.uiBody, { fontSize: 12.5, color: themeColors.inkSoft }]}>{user?.email || "No email provided"}</Text>
            </View>
          </View>

          {/* Location Settings */}
          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: themeColors.card, borderColor: themeColors.line, borderWidth: 1 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setLocationEditing(true);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.locationIconWrap, { backgroundColor: themeColors.tomatoSoft }]}>
              <Ionicons name="location" size={18} color={themeColors.tomato} />
            </View>
            <View style={styles.menuInfo}>
              <Text style={[FONTS.uiBodyBold, { fontSize: 13.5, color: themeColors.ink }]}>Delivery location</Text>
              <Text style={[FONTS.uiBody, { fontSize: 11.5, color: themeColors.inkSoft, marginTop: 2 }]}>
                {locationCity || "Not set"} • {locationPincode || "—"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={themeColors.inkFaint} />
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
            <View style={[styles.menuItem, { backgroundColor: themeColors.card, borderColor: themeColors.line, borderWidth: 1 }]}>
              <View style={[styles.locationIconWrap, { backgroundColor: themeColors.aubergineSoft }]}>
                <Ionicons name="moon" size={18} color={themeColors.aubergine} />
              </View>
              <View style={styles.menuInfo}>
                <Text style={[FONTS.uiBodyBold, { fontSize: 13.5, color: themeColors.ink }]}>Dark mode</Text>
                <Text style={[FONTS.uiBody, { fontSize: 11.5, color: themeColors.inkSoft, marginTop: 2 }]}>Switch app theme</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={(val) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  toggleTheme(val ? "dark" : "light");
                }}
                trackColor={{ false: themeColors.line, true: themeColors.ink }}
                thumbColor={"#FFF"}
              />
            </View>

            {MENU.map((item) => {
              const baseColor = themeColors[item.color] || themeColors.inkSoft;
              const bgSoft = themeColors[`${item.color}Soft`] || themeColors.paperDim || "#F2F2F2";
              return (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.menuItem, { backgroundColor: themeColors.card, borderColor: themeColors.line, borderWidth: 1 }]}
                  activeOpacity={0.6}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (item.label.includes("accounts")) {
                      navigation.navigate("Accounts");
                    } else if (item.label.includes("Help")) {
                      navigation.navigate("SupportChat");
                    } else if (item.label.includes("Terms")) {
                      navigation.navigate("Terms");
                    }
                  }}
                >
                  <View style={[styles.locationIconWrap, { backgroundColor: bgSoft }]}>
                    <Ionicons name={item.icon} size={18} color={baseColor} />
                  </View>
                  <View style={styles.menuInfo}>
                    <Text style={[FONTS.uiBodyBold, { fontSize: 13.5, color: themeColors.ink }]}>{item.label}</Text>
                    <Text style={[FONTS.uiBody, { fontSize: 11.5, color: themeColors.inkSoft, marginTop: 2 }]}>{item.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={themeColors.inkFaint} />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Logout */}
          <View style={{ marginHorizontal: SPACING.xl }}>
            <TouchableOpacity
              style={{ backgroundColor: themeColors.tomatoSoft, borderRadius: 16, padding: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                logout();
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out" size={18} color={themeColors.tomato} />
              <Text style={[FONTS.uiBodyBold, { color: themeColors.tomato, fontSize: 14 }]}>Sign out</Text>
            </TouchableOpacity>
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
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 10,
    gap: 14,
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
