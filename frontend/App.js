import React, { useContext } from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext, AuthProvider } from "./context/AuthContext";
import { WishlistProvider } from "./context/WishlistContext";
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
import InAppBrowser from "./components/InAppBrowser";
import CustomTabBar from "./components/CustomTabBar";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textTertiary,
        tabBarShowLabel: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Likes" component={WishlistScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

import SplashScreen from "./screens/SplashScreen";

const AppNav = () => {
  const { isLoading, userToken } = useContext(AuthContext);
  const [showSplash, setShowSplash] = React.useState(true);

  if (isLoading || showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  const customTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: COLORS.background,
      card: "#FFFFFF",
      text: COLORS.textPrimary,
      border: COLORS.border,
      primary: COLORS.primary,
      notification: COLORS.warning,
    },
  };

  return (
    <NavigationContainer theme={customTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
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
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
});

import { SafeAreaProvider } from "react-native-safe-area-context";

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <WishlistProvider>
          <AppNav />
        </WishlistProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
