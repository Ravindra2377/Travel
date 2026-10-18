import React, { useContext } from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";

import {
  Fraunces_400Regular,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from "@expo-google-fonts/fraunces";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
  IBMPlexMono_600SemiBold,
} from "@expo-google-fonts/ibm-plex-mono";

import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { TripProvider } from "./context/TripContext";
import { COLORS } from "./config/theme";

import CustomTabBar from "./components/CustomTabBar";
import SplashScreen from "./screens/SplashScreen";

// Trip Moments Screens
import HomeScreen from "./screens/HomeScreen";
import TripCoverScreen from "./screens/TripCoverScreen";
import TripJournalScreen from "./screens/TripJournalScreen";
import MomentCaptureScreen from "./screens/MomentCaptureScreen";
import RouteMapScreen from "./screens/RouteMapScreen";
import MomentDetailScreen from "./screens/MomentDetailScreen";
import TripRecapScreen from "./screens/TripRecapScreen";
import PassportScreen from "./screens/PassportScreen";
import SearchScreen from "./screens/SearchScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  const { themeColors } = useTheme();
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: themeColors.primary,
        tabBarInactiveTintColor: themeColors.textTertiary,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Journal" component={TripJournalScreen} />
      <Tab.Screen name="Capture" component={MomentCaptureScreen} />
      <Tab.Screen name="Map" component={RouteMapScreen} />
      <Tab.Screen name="Passport" component={PassportScreen} />
    </Tab.Navigator>
  );
};

const AppNav = () => {
  const { themeColors, isDark } = useTheme();
  const [showSplash, setShowSplash] = React.useState(true);
  const [fontWaitExpired, setFontWaitExpired] = React.useState(false);

  const [fontsLoaded, fontError] = useFonts({
    Fraunces: Fraunces_400Regular,
    FrauncesMedium: Fraunces_500Medium,
    FrauncesSemiBold: Fraunces_600SemiBold,
    FrauncesBold: Fraunces_700Bold,
    Inter: Inter_400Regular,
    InterMedium: Inter_500Medium,
    InterSemiBold: Inter_600SemiBold,
    InterBold: Inter_700Bold,
    IBMPlexMono: IBMPlexMono_400Regular,
    IBMPlexMonoMedium: IBMPlexMono_500Medium,
    IBMPlexMonoSemiBold: IBMPlexMono_600SemiBold,
  });

  const fontsReady = fontsLoaded || Boolean(fontError) || fontWaitExpired;

  React.useEffect(() => {
    const safetyTimer = setTimeout(() => {
      console.warn("[App] Startup timeout reached; continuing with available fonts");
      setFontWaitExpired(true);
      setShowSplash(false);
    }, 4000);
    return () => clearTimeout(safetyTimer);
  }, []);

  if (showSplash || !fontsReady) {
    return (
      <>
        <StatusBar style={isDark ? "light" : "dark"} />
        <SplashScreen onFinish={() => setShowSplash(false)} />
      </>
    );
  }

  const customTheme = {
    ...DefaultTheme,
    dark: isDark,
    colors: {
      ...DefaultTheme.colors,
      background: themeColors.paper,
      card: themeColors.card,
      text: themeColors.textPrimary,
      border: themeColors.border,
      primary: themeColors.primary,
      notification: themeColors.warning,
    },
  };

  return (
    <NavigationContainer theme={customTheme}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={{ flex: 1, backgroundColor: themeColors.paper }}>
        <Stack.Navigator
          screenOptions={{ headerShown: false, animation: "fade" }}
          initialRouteName="MainTabs"
        >
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen
            name="TripCover"
            component={TripCoverScreen}
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="Journal"
            component={TripJournalScreen}
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="Capture"
            component={MomentCaptureScreen}
            options={{ animation: "slide_from_bottom" }}
          />
          <Stack.Screen
            name="Map"
            component={RouteMapScreen}
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="MomentDetail"
            component={MomentDetailScreen}
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="TripRecap"
            component={TripRecapScreen}
            options={{ animation: "slide_from_bottom" }}
          />
          <Stack.Screen
            name="Passport"
            component={PassportScreen}
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="Search"
            component={SearchScreen}
            options={{ animation: "slide_from_right" }}
          />
        </Stack.Navigator>
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

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <TripProvider>
          <AppNav />
        </TripProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
