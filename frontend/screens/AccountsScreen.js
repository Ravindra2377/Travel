import React, { useState, useRef, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "../components/Icon";
import { LinearGradient } from "expo-linear-gradient";
import api from "../config/api";
import { SPACING, RADIUS, FONTS, SHADOWS } from "../config/theme";
import { useTheme } from "../context/ThemeContext";
import * as Haptics from "expo-haptics";
import ScreenHeader from "../components/ScreenHeader";

// Platform configuration with proper login URLs
const PLATFORMS = [
  {
    id: "Blinkit",
    name: "Blinkit",
    loginUrl: "https://blinkit.com/",
    testUrl: "https://blinkit.com/v6/search/products?q=milk&start=0&size=5",
    color: "#F8CB46",
    icon: "flash",
    requiredTokens: ["auth", "authKey"],
  },
  {
    id: "Zepto",
    name: "Zepto",
    loginUrl: "https://www.zepto.com/",
    testUrl: "https://api.zepto.co.in/api/v1/search",
    color: "#7C3AED",
    icon: "bicycle",
    requiredTokens: ["user", "cart"],
  },
  {
    id: "BigBasket",
    name: "BigBasket",
    loginUrl: "https://www.bigbasket.com/",
    testUrl: "https://www.bigbasket.com/listing-svc/v2/products?q=milk&page=1",
    color: "#84C225",
    icon: "basket",
    requiredTokens: ["sessionid", "_bb_vid"],
  },
  {
    id: "Amazon",
    name: "Amazon",
    loginUrl: "https://www.amazon.in/ap/signin",
    testUrl: "https://www.amazon.in/s?k=milk",
    color: "#FF9900",
    icon: "cart",
    requiredTokens: ["session-id"],
  },
  {
    id: "Flipkart",
    name: "Flipkart",
    loginUrl: "https://www.flipkart.com/",
    testUrl: "https://www.flipkart.com/search?q=milk",
    color: "#2874F0",
    icon: "bag",
    requiredTokens: ["T"],
  },
];

export default function AccountsScreen({ navigation }) {
  const { themeColors, isDark } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [currentPlatform, setCurrentPlatform] = useState(null);
  const [connected, setConnected] = useState({});
  const [loading, setLoading] = useState({});
  const webViewRef = useRef(null);

  React.useEffect(() => {
    checkConnections();
  }, []);

  const checkConnections = async () => {
    try {
      const tokens = await AsyncStorage.getItem("userTokens");
      if (tokens) {
        const parsed = JSON.parse(tokens);
        const status = {};

        PLATFORMS.forEach((platform) => {
          const platformTokens = parsed[platform.id];
          if (!platformTokens || Object.keys(platformTokens).length === 0) {
            status[platform.id] = false;
            return;
          }

          const hasRequiredToken = platform.requiredTokens.some(
            (tokenKey) => {
              const fromVal = platformTokens[tokenKey];
              const fromCookie = platformTokens.cookie && platformTokens.cookie.includes(tokenKey);
              return !!(fromVal || fromCookie);
            }
          );
          status[platform.id] = hasRequiredToken;
        });

        setConnected(status);
      }
    } catch (e) {
      console.error("[AccountsScreen] Error checking connections:", e);
    }
  };

  const openLogin = (platform) => {
    setCurrentPlatform(platform);
    setModalVisible(true);
  };

  const disconnectAccount = async (platformId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Disconnect Account",
      `Are you sure you want to disconnect from ${platformId}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            try {
              const tokens = await AsyncStorage.getItem("userTokens");
              if (tokens) {
                const parsed = JSON.parse(tokens);
                delete parsed[platformId];
                await AsyncStorage.setItem(
                  "userTokens",
                  JSON.stringify(parsed),
                );
                await checkConnections();
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success,
                );
                Alert.alert("Success", `Disconnected from ${platformId}`);
              }
            } catch (e) {
              console.error(e);
            }
          },
        },
      ],
    );
  };

  const handleWebViewMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === "LOG") {
        console.log(`[WebView-${currentPlatform?.id}] ${data.message}`);
      } else if (data.type === "TOKENS" && currentPlatform) {
        console.log(
          `[WebView] ✅ Tokens captured for ${currentPlatform.id}:`,
          Object.keys(data.payload),
        );

        await saveTokens(currentPlatform.id, data.payload);
        setModalVisible(false);
        await checkConnections();

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          "Success!",
          `✅ ${currentPlatform.name} connected successfully!\n\nYou can now search and compare prices.`,
          [{ text: "OK" }],
        );
      }
    } catch (e) {
      console.error("[WebView] Error parsing message:", e);
    }
  };

  const saveTokens = async (platformId, newTokens) => {
    try {
      const existing = await AsyncStorage.getItem("userTokens");
      const tokens = existing ? JSON.parse(existing) : {};

      tokens[platformId] = {
        ...tokens[platformId],
        ...newTokens,
        _capturedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem("userTokens", JSON.stringify(tokens));
      console.log(`[Tokens] Saved tokens for ${platformId} locally`);

      try {
        await api.post("/accounts/connect", {
          platform: platformId,
          tokens: tokens[platformId],
        });
        console.log(`[Tokens] Uploaded ${platformId} tokens to backend`);
      } catch (backendErr) {
        console.warn(
          `[Tokens] Backend upload failed (non-critical):`,
          backendErr?.message,
        );
      }
    } catch (e) {
      console.error("[Tokens] Save error:", e);
      throw e;
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.paper }]}>
      <View style={[styles.container, { backgroundColor: themeColors.paper }]}>

        <ScreenHeader
          title="Link Accounts"
          subtitle="Login once to enable price comparisons"
          showBack={true}
          onBackPress={() => navigation.goBack()}
          leftAlign={true}
        />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Info Card */}
          <View style={[styles.infoCard, { backgroundColor: themeColors.card, borderColor: themeColors.line, borderWidth: 1 }]}>
            <Ionicons name="information-circle" size={20} color={themeColors.inkSoft} />
            <Text style={[styles.infoText, { color: themeColors.inkSoft }]}>
              Tap "Connect" and log in to each platform. Your credentials stay secure in the app.
            </Text>
          </View>

          {PLATFORMS.map((platform) => {
            const isConnected = connected[platform.id];
            return (
              <View
                key={platform.id}
                style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.line, borderWidth: 1 }]}
              >
                <View style={styles.cardLeft}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: platform.color + "20" },
                    ]}
                  >
                    <Ionicons name={platform.icon} size={24} color={platform.color} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.platformName, { color: themeColors.ink }]}>{platform.name}</Text>
                    {isConnected ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                        <Text style={[styles.statusText, { color: "#10B981" }]}>Connected</Text>
                      </View>
                    ) : (
                      <Text style={[styles.statusText, { color: themeColors.inkSoft }]}>Not linked</Text>
                    )}
                  </View>
                </View>

                <View style={styles.cardButtons}>
                  {isConnected ? (
                    <TouchableOpacity
                      style={[styles.buttonDisconnect, { backgroundColor: themeColors.card, borderColor: themeColors.line, borderWidth: 1 }]}
                      onPress={() => disconnectAccount(platform.id)}
                    >
                      <Text style={[styles.buttonDisconnectText, { color: themeColors.ink }]}>Disconnect</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.buttonConnect, { backgroundColor: themeColors.ink }]}
                      onPress={() => openLogin(platform)}
                    >
                      <Text style={styles.buttonConnectText}>Connect</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>

        <Modal
          animationType="slide"
          transparent={false}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.6)" }]}>
            <View style={[styles.modalContent, { backgroundColor: themeColors.paper }]}>
              <View style={[styles.modalHeader, { borderBottomColor: themeColors.line }]}>
                <Text style={[styles.modalTitle, { color: themeColors.ink }]}>Connect {currentPlatform?.name}</Text>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={{ padding: 4 }}
                >
                  <Ionicons name="close" size={24} color={themeColors.ink} />
                </TouchableOpacity>
              </View>

              <WebView
                ref={webViewRef}
                source={{ uri: currentPlatform?.loginUrl }}
                style={styles.webview}
                injectedJavaScript={`
                  (function() {
                    let hasProcessed = false;
                    function log(msg) {
                      try { window.ReactNativeWebView.postMessage(JSON.stringify({type: 'LOG', message: msg})); } catch(e) {}
                    }
                    function sendTokens() {
                      if (hasProcessed) return;
                      const cookies = document.cookie;
                      const ls = {...localStorage};
                      let payload = {};
                      let isValid = false;
                      const host = window.location.hostname;
                      if (host.includes('blinkit') && (ls.auth || ls.authKey)) { payload['auth'] = ls.auth; payload['authKey'] = ls.authKey; payload['cookie'] = cookies; isValid = true; }
                      else if (host.includes('zepto') && (ls.user || cookies.includes('session_id'))) { payload['user'] = ls.user; payload['cookie'] = cookies; isValid = true; }
                      else if (host.includes('bigbasket') && (cookies.includes('sessionid') || cookies.includes('_bb_vid'))) { payload['cookie'] = cookies; isValid = true; }
                      else if (host.includes('amazon') && cookies.includes('session-id')) { payload['cookie'] = cookies; isValid = true; }
                      else if (host.includes('flipkart') && cookies.includes('T=')) { payload['cookie'] = cookies; isValid = true; }
                      
                      if (isValid) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({type: 'TOKENS', payload: payload}));
                        hasProcessed = true;
                      }
                    }
                    setInterval(sendTokens, 2000);
                  })();
                `}
                onMessage={handleWebViewMessage}
              />
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  headerTitle: {
    ...FONTS.heading,
    fontSize: 28,
  },
  headerSubtitle: {
    ...FONTS.uiBody,
    fontSize: 14,
    marginTop: 4,
  },
  scrollContent: {
    padding: SPACING.xl,
    paddingTop: SPACING.lg,
  },
  infoCard: {
    flexDirection: "row",
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.xl,
    alignItems: "center",
    gap: 12,
  },
  infoText: {
    ...FONTS.uiBody,
    fontSize: 13,
    flex: 1,
    lineHeight: 20,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.md,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: {
    flex: 1,
  },
  platformName: {
    ...FONTS.uiBodyBold,
    fontSize: 16,
    marginBottom: 4,
  },
  statusText: {
    ...FONTS.uiBody,
    fontSize: 13,
  },
  cardButtons: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  buttonConnect: {
    flexDirection: "row",
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    alignItems: "center",
    gap: 8,
    ...SHADOWS.md,
  },
  buttonConnectText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  buttonReconnect: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  buttonDisconnect: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
  },
  modalHeaderLeft: {
    flex: 1,
  },
  modalTitle: {
    ...FONTS.h3,
    fontSize: 18,
  },
  modalSubtitle: {
    ...FONTS.caption,
    marginTop: 2,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  webview: {
    flex: 1,
  },
});
