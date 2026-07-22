import React, { useState, useRef, useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Platform,
  Animated,
  Dimensions,
  ActivityIndicator,
  Image,
  ScrollView,
  PanResponder,
  Keyboard,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "../components/Icon";
import { WishlistContext } from "../context/WishlistContext";
import { SPACING, RADIUS, FONTS, SHADOWS } from "../config/theme";
import { useTheme } from "../context/ThemeContext";
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
  const breathAnim = useRef(new Animated.Value(1)).current;
  const pan = useRef(new Animated.ValueXY()).current;
  const { wishlist } = useContext(WishlistContext);
  const navigation = useNavigation();
  const { themeColors, isDark } = useTheme();

  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setKeyboardVisible(true);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    let loop;
    if (!open) {
      breathAnim.setValue(1);
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(breathAnim, {
            toValue: 1.1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(breathAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
    }
    return () => {
      if (loop) loop.stop();
    };
  }, [open, breathAnim]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        pan.extractOffset();
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      }
    })
  ).current;

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
      duration: 120,
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
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          text: cleanedReply,
          showCart,
          suggestedSearches,
        },
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

  const renderBubbleWrapper = (isUser, children) => {
    if (isUser) {
      return (
        <View
          style={[
            styles.bubble,
            styles.userBubble,
            { backgroundColor: themeColors.ink },
          ]}
        >
          {children}
        </View>
      );
    }
    return (
      <View
        style={[styles.bubble, styles.aiBubble, { backgroundColor: themeColors.card, borderColor: themeColors.line, borderWidth: 1 }]}
      >
        {children}
      </View>
    );
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === "user";
    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.aiRow]}>
        {!isUser && (
          <View
            style={[styles.aiAvatar, { backgroundColor: themeColors.card, borderColor: themeColors.line, borderWidth: 1 }]}
          >
            <Ionicons name="sparkles" size={12} color={themeColors.ink} />
          </View>
        )}
        {renderBubbleWrapper(isUser, 
          <>
          {item.text ? (
            <Text
              style={[
                styles.bubbleText,
                { color: isUser ? "#fff" : themeColors.textPrimary },
              ]}
            >
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
                  style={[
                    styles.miniProductCard,
                    {
                      backgroundColor: themeColors.background,
                      borderColor: themeColors.border,
                    },
                  ]}
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
                  <Text
                    style={[
                      styles.miniProductTitle,
                      { color: themeColors.textPrimary },
                    ]}
                    numberOfLines={2}
                  >
                    {product.name || product.title}
                  </Text>
                  <Text
                    style={[
                      styles.miniProductPrice,
                      { color: themeColors.primary },
                    ]}
                  >
                    ₹
                    {product.price ||
                      (product.listings && product.listings[0]?.price) ||
                      "--"}
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
                  style={[
                    styles.searchChip,
                    { backgroundColor: themeColors.primary },
                  ]}
                  activeOpacity={0.8}
                  onPress={() => {
                    closeCopilot();
                    navigation.navigate("MainTabs", {
                      screen: "Search",
                      params: { query: searchQuery },
                    });
                  }}
                >
                  <Ionicons name="search" size={12} color="#fff" />
                  <Text style={styles.searchChipText}>
                    Search {searchQuery}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
        )}
      </View>
    );
  };

  const pressFab = () => {
    openCopilot();
  };

  return (
    <>
      {/* Floating Action Button */}
      {!open && (
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.fab,
            {
              transform: [
                ...pan.getTranslateTransform(),
                { scale: breathAnim },
              ],
            },
          ]}
        >
          <Animated.View style={{ transform: [{ scale: fabScale }] }}>
            <TouchableOpacity onPress={pressFab} activeOpacity={1}>
              <View style={[styles.fabGradient, { backgroundColor: themeColors.ink }]}>
                <Ionicons name="sparkles" size={22} color="#fff" />
              </View>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      )}

      {/* Slide-up Panel */}
      {open && (
        <Animated.View
          style={[
            styles.panel,
            {
              backgroundColor: themeColors.background,
              transform: [{ translateY: slideAnim }],
              height: isKeyboardVisible ? SCREEN_H * 0.95 : SCREEN_H * 0.72,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.panelHeader, { backgroundColor: themeColors.paper, borderBottomWidth: 1, borderBottomColor: themeColors.line }]}>
            <View style={styles.panelHeaderLeft}>
              <View style={[styles.panelAvatar, { backgroundColor: themeColors.card, borderColor: themeColors.line, borderWidth: 1 }]}>
                <Ionicons name="sparkles" size={16} color={themeColors.ink} />
              </View>
              <View>
                <Text style={[styles.panelTitle, { color: themeColors.ink }]}>Beans</Text>
              </View>
            </View>
            <TouchableOpacity onPress={closeCopilot} style={styles.closeBtn}>
              <Ionicons
                name="chevron-down"
                size={22}
                color={themeColors.inkSoft}
              />
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <View style={{ flex: 1, paddingBottom: isKeyboardVisible ? keyboardHeight : 0 }}>
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
                    <View
                      style={[styles.aiAvatar, { backgroundColor: themeColors.card, borderColor: themeColors.line, borderWidth: 1 }]}
                    >
                      <Ionicons name="sparkles" size={12} color={themeColors.ink} />
                    </View>
                    <View
                      style={[
                        styles.bubble,
                        styles.aiBubble,
                        styles.typingBubble,
                        { backgroundColor: themeColors.card, borderColor: themeColors.line, borderWidth: 1 },
                      ]}
                    >
                      <ActivityIndicator
                        size="small"
                        color={themeColors.inkSoft}
                      />
                      <Text
                        style={[
                          styles.typingText,
                          { color: themeColors.inkSoft },
                        ]}
                      >
                        Thinking...
                      </Text>
                    </View>
                  </View>
                ) : null
              }
            />

            {/* Input */}
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: themeColors.paper,
                  borderTopColor: themeColors.line,
                },
              ]}
            >
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: themeColors.card,
                    borderColor: themeColors.line,
                  },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: themeColors.ink }]}
                  placeholder="Ask me anything..."
                  placeholderTextColor={themeColors.inkFaint}
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
                  <View
                    style={[
                      styles.sendGradient,
                      { backgroundColor: inputText.trim() ? themeColors.ink : themeColors.line },
                    ]}
                  >
                    <Ionicons name="send" size={16} color="#fff" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 140,
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
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    ...FONTS.body,
    fontSize: 14,
    lineHeight: 20,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typingText: {
    ...FONTS.caption,
  },
  inputContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === "ios" ? 36 : 32,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 44,
    ...FONTS.body,
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
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginRight: SPACING.md,
    borderWidth: 1,
  },
  miniProductImg: {
    width: "100%",
    height: 60,
    marginBottom: 6,
  },
  miniProductTitle: {
    ...FONTS.captionBold,
    fontSize: 10,
    lineHeight: 14,
    marginBottom: 4,
  },
  miniProductPrice: {
    ...FONTS.bodyBold,
    fontSize: 12,
  },
  suggestedSearchesContainer: {
    marginTop: SPACING.sm,
    gap: 8,
  },
  searchChip: {
    flexDirection: "row",
    alignItems: "center",
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
