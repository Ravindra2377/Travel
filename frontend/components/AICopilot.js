import React, { useState, useRef, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  ActivityIndicator,
  Image,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { WishlistContext } from "../context/WishlistContext";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../config/theme";
import GroqService from "../services/GroqService";
import * as Haptics from "expo-haptics";

const { height: SCREEN_H } = Dimensions.get("window");

const WELCOME_MESSAGE =
  "Hi! I'm BEANS, your AI Shopping Copilot 🛒\nAsk me anything — best deals, product comparisons, or grocery tips!";

const AICopilot = () => {
  const [open, setOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([
    { id: "welcome", role: "assistant", text: WELCOME_MESSAGE },
  ]);
  const historyRef = useRef([]);
  const flatListRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const fabScale = useRef(new Animated.Value(1)).current;
  const { wishlist } = useContext(WishlistContext);
  const navigation = useNavigation();

  const openCopilot = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setOpen(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 65,
      friction: 11,
      useNativeDriver: true,
    }).start();
  };

  const closeCopilot = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(slideAnim, {
      toValue: SCREEN_H,
      duration: 280,
      useNativeDriver: true,
    }).start(() => setOpen(false));
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    const userText = inputText.trim();

    const userMsg = { id: Date.now().toString(), role: "user", text: userText };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newHistory = [
      ...historyRef.current,
      { role: "user", content: userText },
    ].slice(-10);
    historyRef.current = newHistory;

    // Build context from wishlist
    const ctx =
      wishlist.length > 0
        ? {
            screen: "Wishlist",
            wishlistCount: wishlist.length,
            wishlistItems: wishlist.map((w) => w.name || w.title).slice(0, 6),
          }
        : {};

    try {
      const reply = await GroqService.copilotChat(newHistory, ctx);
      
      const showCart = reply.includes("[SHOW_CART]");
      let cleanedReply = reply.replace(/\[SHOW_CART\]/g, "");
      
      const suggestedSearches = [];
      const searchRegex = /\[SUGGEST_SEARCH:\s*(.*?)\]/g;
      let match;
      while ((match = searchRegex.exec(cleanedReply)) !== null) {
        if (match[1]) suggestedSearches.push(match[1].trim());
      }
      cleanedReply = cleanedReply.replace(searchRegex, "").trim();

      historyRef.current = [
        ...historyRef.current,
        { role: "assistant", content: cleanedReply },
      ];
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", text: cleanedReply, showCart, suggestedSearches },
      ]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          text: "I'm having trouble connecting. Please try again! 🔄",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === "user";
    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.aiRow]}>
        {!isUser && (
          <LinearGradient colors={COLORS.gradientAccent} style={styles.aiAvatar}>
            <Ionicons name="sparkles" size={12} color="#fff" />
          </LinearGradient>
        )}
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
          {item.text ? (
            <Text style={[styles.bubbleText, isUser && styles.userBubbleText]}>
              {item.text}
            </Text>
          ) : null}
          
          {item.showCart && wishlist.length > 0 && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.cartCarousel}
            >
              {wishlist.map((product, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={styles.miniProductCard}
                  activeOpacity={0.8}
                  onPress={() => {
                    closeCopilot();
                    navigation.navigate("ProductDetail", { product });
                  }}
                >
                  <Image 
                    source={{ uri: product.image_url || product.image }} 
                    style={styles.miniProductImg} 
                    resizeMode="contain" 
                  />
                  <Text style={styles.miniProductTitle} numberOfLines={2}>
                    {product.name || product.title}
                  </Text>
                  <Text style={styles.miniProductPrice}>
                    ₹{product.price || (product.listings && product.listings[0]?.price) || "--"}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {item.suggestedSearches && item.suggestedSearches.length > 0 && (
            <View style={styles.suggestedSearchesContainer}>
              {item.suggestedSearches.map((searchQuery, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={styles.searchChip}
                  activeOpacity={0.8}
                  onPress={() => {
                    closeCopilot();
                    navigation.navigate("MainTabs", { screen: "Search", params: { query: searchQuery } });
                  }}
                >
                  <Ionicons name="search" size={12} color="#fff" />
                  <Text style={styles.searchChipText}>Search {searchQuery}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  const pressFab = () => {
    Animated.sequence([
      Animated.timing(fabScale, {
        toValue: 0.85,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.spring(fabScale, {
        toValue: 1,
        tension: 200,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start(() => openCopilot());
  };

  return (
    <>
      {/* Floating Action Button */}
      {!open && (
        <Animated.View
          style={[styles.fab, { transform: [{ scale: fabScale }] }]}
        >
          <TouchableOpacity onPress={pressFab} activeOpacity={1}>
            <LinearGradient
              colors={COLORS.gradientAccent}
              style={styles.fabGradient}
            >
              <Ionicons name="sparkles" size={22} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Slide-up Panel */}
      {open && (
        <Animated.View
          style={[styles.panel, { transform: [{ translateY: slideAnim }] }]}
        >
          {/* Header */}
          <LinearGradient
            colors={COLORS.gradientHero}
            style={styles.panelHeader}
          >
            <View style={styles.panelHeaderLeft}>
              <LinearGradient
                colors={COLORS.gradientAccent}
                style={styles.panelAvatar}
              >
                <Ionicons name="sparkles" size={16} color="#fff" />
              </LinearGradient>
              <View>
                <Text style={styles.panelTitle}>Beans</Text>
              </View>
            </View>
            <TouchableOpacity onPress={closeCopilot} style={styles.closeBtn}>
              <Ionicons
                name="chevron-down"
                size={22}
                color="rgba(255,255,255,0.8)"
              />
            </TouchableOpacity>
          </LinearGradient>

          {/* Messages */}
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={0}
          >
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.messageList}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({ animated: true })
              }
              ListFooterComponent={
                isTyping ? (
                  <View style={[styles.messageRow, styles.aiRow]}>
                    <LinearGradient
                      colors={COLORS.gradientAccent}
                      style={styles.aiAvatar}
                    >
                      <Ionicons name="sparkles" size={12} color="#fff" />
                    </LinearGradient>
                    <View
                      style={[styles.bubble, styles.aiBubble, styles.typingBubble]}
                    >
                      <ActivityIndicator size="small" color={COLORS.primary} />
                      <Text style={styles.typingText}>Thinking...</Text>
                    </View>
                  </View>
                ) : null
              }
            />

            {/* Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Ask me anything..."
                  placeholderTextColor={COLORS.textTertiary}
                  value={inputText}
                  onChangeText={setInputText}
                  returnKeyType="send"
                  onSubmitEditing={sendMessage}
                />
                <TouchableOpacity
                  onPress={sendMessage}
                  disabled={!inputText.trim()}
                  style={styles.sendBtn}
                >
                  <LinearGradient
                    colors={
                      inputText.trim()
                        ? COLORS.gradientAccent
                        : [COLORS.border, COLORS.border]
                    }
                    style={styles.sendGradient}
                  >
                    <Ionicons name="send" size={16} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 100,
    right: 20,
    zIndex: 9999,
    ...SHADOWS.md,
  },
  fabGradient: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },
  panel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_H * 0.72,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    zIndex: 9998,
    overflow: "hidden",
    ...SHADOWS.md,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  panelHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  panelAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  panelSubtitle: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  messageList: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: SPACING.md,
    alignItems: "flex-end",
    gap: 8,
  },
  userRow: { justifyContent: "flex-end" },
  aiRow: { justifyContent: "flex-start" },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.lg,
    ...SHADOWS.sm,
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    ...FONTS.body,
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  userBubbleText: { color: "#fff" },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typingText: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
  },
  inputContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: Platform.OS === "ios" ? 36 : 32,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: {
    flex: 1,
    minHeight: 44,
    ...FONTS.body,
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  sendBtn: { marginLeft: 8 },
  sendGradient: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  cartCarousel: {
    marginTop: SPACING.sm,
    paddingVertical: 4,
  },
  miniProductCard: {
    width: 110,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  miniProductImg: {
    width: "100%",
    height: 60,
    marginBottom: 6,
  },
  miniProductTitle: {
    ...FONTS.captionBold,
    fontSize: 10,
    color: COLORS.textPrimary,
    lineHeight: 14,
    marginBottom: 4,
  },
  miniProductPrice: {
    ...FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.textPrimary,
  },
  suggestedSearchesContainer: {
    marginTop: SPACING.sm,
    gap: 8,
  },
  searchChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    alignSelf: "flex-start",
    gap: 6,
  },
  searchChipText: {
    ...FONTS.captionBold,
    color: "#fff",
  },
});

export default AICopilot;
