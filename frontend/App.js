import React, { useContext } from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import { AuthContext, AuthProvider } from "./context/AuthContext";
import { WishlistProvider } from "./context/WishlistContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { View, ActivityIndicator, StyleSheet, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { COLORS, SHADOWS, FONTS } from "./config/theme";

// Auth Screens
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";

// Main Screens
import HomeScreen from "./screens/HomeScreen";
import SearchScreen from "./screens/SearchScreen";
import ProductDetailScreen from "./screens/ProductDetailScreen";
import ProfileScreen from "./screens/ProfileScreen";
import WishlistScreen from "./screens/WishlistScreen";
import AccountsScreen from "./screens/AccountsScreen";
import SupportChatScreen from "./screens/SupportChatScreen";
import TermsScreen from "./screens/TermsScreen";
import MealPlannerScreen from "./screens/MealPlannerScreen";
import InAppBrowser from "./components/InAppBrowser";
import CustomTabBar from "./components/CustomTabBar";
import AICopilot from "./components/AICopilot";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  const { themeColors } = useTheme();
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: themeColors.primary,
        tabBarInactiveTintColor: themeColors.textTertiary,
        tabBarShowLabel: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="MealPlanner" component={MealPlannerScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Likes" component={WishlistScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

import SplashScreen from "./screens/SplashScreen";

import * as Font from "expo-font";

const AppNav = () => {
  const { isLoading, userToken } = useContext(AuthContext);
  const { themeColors, isDark } = useTheme();
  const [showSplash, setShowSplash] = React.useState(true);

  const [fontsLoaded] = Font.useFonts({
    ...Ionicons.font,
  });

  React.useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setButtonStyleAsync(isDark ? "light" : "dark");
    }
  }, [isDark]);

  if (!fontsLoaded || isLoading || showSplash) {
    return (
      <>
        <StatusBar style={isDark ? "light" : "dark"} translucent backgroundColor="transparent" />
        <SplashScreen onFinish={() => setShowSplash(false)} />
      </>
    );
  }

  const customTheme = {
    ...DefaultTheme,
    dark: isDark,
    colors: {
      ...DefaultTheme.colors,
      background: themeColors.background,
      card: themeColors.surface,
      text: themeColors.textPrimary,
      border: themeColors.border,
      primary: themeColors.primary,
      notification: themeColors.warning,
    },
  };

  return (
    <NavigationContainer theme={customTheme}>
      <StatusBar style={isDark ? "light" : "dark"} translucent />
      <View style={{ flex: 1, backgroundColor: themeColors.background }}>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: "fade" }}>
          {userToken !== null ? (
            <>
              <Stack.Screen name="MainTabs" component={MainTabs} />
              <Stack.Screen
                name="ProductDetail"
                component={ProductDetailScreen}
                options={{ animation: "slide_from_right" }}
              />
              <Stack.Screen
                name="InAppBrowser"
                component={InAppBrowser}
                options={{ animation: "slide_from_bottom" }}
              />
              <Stack.Screen
                name="Accounts"
                component={AccountsScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="SupportChat"
                component={SupportChatScreen}
                options={{ animation: "slide_from_right", headerShown: false }}
              />
              <Stack.Screen
                name="Terms"
                component={TermsScreen}
                options={{ animation: "slide_from_right", headerShown: false }}
              />
              <Stack.Screen
                name="MealPlanner"
                component={MealPlannerScreen}
                options={{ animation: "slide_from_bottom", headerShown: false }}
              />
            </>
          ) : (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
              <Stack.Screen
                name="SupportChat"
                component={SupportChatScreen}
                options={{ animation: "slide_from_right", headerShown: false }}
              />
              <Stack.Screen
                name="Terms"
                component={TermsScreen}
                options={{ animation: "slide_from_right", headerShown: false }}
              />
            </>
          )}
        </Stack.Navigator>
        {/* AICopilot must be inside NavigationContainer to use useNavigationState */}
        {userToken !== null && <AICopilot />}
      </View>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

import { SafeAreaProvider } from "react-native-safe-area-context";

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <WishlistProvider>
            <AppNav />
          </WishlistProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
