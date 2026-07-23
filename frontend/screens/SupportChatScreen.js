import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "../components/Icon";
import ScreenHeader from "../components/ScreenHeader";
import { SPACING, RADIUS, SHADOWS, FONTS } from "../config/theme";
import { useTheme } from "../context/ThemeContext";
import * as Haptics from "expo-haptics";
import GroqService from "../services/GroqService";

const SupportChatScreen = ({ navigation }) => {
  const { themeColors, isDark } = useTheme();
  const [messages, setMessages] = useState([
    {
      id: "1",
      text: "Hi there! 👋 I'm BEANS, your CompareZ AI assistant. Ask me anything about finding the best grocery deals!",
      sender: "support",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const historyRef = useRef([]);
  const flatListRef = useRef(null);

  const sendMessage = async () => {
    if (inputText.trim().length === 0) return;

    const userText = inputText.trim();
    const userMessage = {
      id: Date.now().toString(),
      text: userText,
      sender: "user",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newHistory = [
      ...historyRef.current,
      { role: "user", content: userText },
    ].slice(-20);
    historyRef.current = newHistory;

    try {
      const reply = await GroqService.chat(newHistory);
      historyRef.current = [
        ...historyRef.current,
        { role: "assistant", content: reply },
      ];

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: reply,
        sender: "support",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, aiMessage]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          text: "I'm having trouble connecting right now. Please try again in a moment! 🔄",
          sender: "support",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.sender === "user";
    return (
      <View
        style={[styles.messageRow, isUser ? styles.userRow : styles.supportRow]}
      >
        {!isUser && (
          <View
            style={[
              styles.supportAvatar,
              { backgroundColor: themeColors.card, borderColor: themeColors.line, borderWidth: 1 },
            ]}
          >
            <Ionicons name="sparkles" size={12} color={themeColors.ink} />
          </View>
        )}
        <View
          style={[
            styles.bubble,
            isUser ? styles.userBubble : styles.supportBubble,
            {
              backgroundColor: isUser
                ? themeColors.ink
                : themeColors.card,
              borderColor: isUser ? "transparent" : themeColors.line,
              borderWidth: isUser ? 0 : 1,
            },
          ]}
        >
          <Text
            style={[
              FONTS.uiBody,
              {
                fontSize: 13.5,
                lineHeight: 21,
                color: isUser ? "#fff" : themeColors.ink,
              },
            ]}
          >
            {item.text}
          </Text>
          <Text
            style={[
              FONTS.uiBody,
              {
                fontSize: 10.5,
                marginTop: 4,
                color: isUser ? "rgba(255,255,255,0.65)" : themeColors.inkFaint,
              },
            ]}
          >
            {item.time}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.paper }]}>
      <View
        style={[styles.container, { backgroundColor: themeColors.paper }]}
      >
        <ScreenHeader
          showBack={true}
          onBackPress={() => navigation.goBack()}
          leftAlign={true}
          centerComponent={
            <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.sm }}>
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: themeColors.card,
                  borderColor: themeColors.line,
                  borderWidth: 1,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="sparkles" size={18} color={themeColors.ink} />
              </View>
              <View>
                <Text style={[FONTS.uiBodyBold, { color: themeColors.ink, fontSize: 14.5 }]}>
                  Beans
                </Text>
                <View style={styles.onlineStatus}>
                  <View style={styles.statusDot} />
                  <Text style={[FONTS.uiBody, { color: themeColors.inkSoft, fontSize: 11 }]}>
                    AI shopping copilot · online
                  </Text>
                </View>
              </View>
            </View>
          }
        />

        {/* Messages */}
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
              <View style={[styles.messageRow, styles.supportRow]}>
                <View
                  style={[
                    styles.supportAvatar,
                    { backgroundColor: themeColors.card, borderColor: themeColors.line, borderWidth: 1 },
                  ]}
                >
                  <Ionicons name="sparkles" size={12} color={themeColors.ink} />
                </View>
                <View
                  style={[
                    styles.bubble,
                    styles.supportBubble,
                    styles.typingBubble,
                    { backgroundColor: themeColors.card, borderColor: themeColors.line, borderWidth: 1 },
                  ]}
                >
                  <ActivityIndicator
                    size="small"
                    color={themeColors.inkSoft}
                  />
                </View>
              </View>
            ) : null
          }
        />

        {/* Input */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
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
                style={[
                  FONTS.uiBody,
                  {
                    flex: 1,
                    color: themeColors.ink,
                    paddingVertical: 10,
                    fontSize: 14,
                    maxHeight: 100,
                  },
                ]}
                placeholder="Ask me anything…"
                placeholderTextColor={themeColors.inkFaint}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxHeight={100}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  {
                    backgroundColor: themeColors.primary,
                    opacity: inputText.trim().length > 0 ? 1 : 0.4,
                  },
                ]}
                onPress={sendMessage}
                disabled={inputText.trim().length === 0}
              >
                <Ionicons name="send" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  header: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    ...FONTS.h3,
    color: "#FFFFFF",
    fontSize: 18,
  },
  onlineStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  statusText: {
    ...FONTS.caption,
    color: "rgba(255,255,255,0.8)",
  },
  messageList: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 16,
    maxWidth: "85%",
  },
  userRow: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  supportRow: {
    alignSelf: "flex-start",
  },
  supportAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    marginRight: 8,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
    ...SHADOWS.sm,
  },
  userBubble: {
    borderBottomRightRadius: 4,
    marginLeft: 8,
  },
  supportBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    ...FONTS.body,
    fontSize: 15,
    lineHeight: 20,
  },
  timeText: {
    ...FONTS.caption,
    fontSize: 10,
    marginTop: 4,
    textAlign: "right",
  },
  typingBubble: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    minWidth: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  inputContainer: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === "ios" ? 30 : 15,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    ...FONTS.body,
    fontSize: 15,
    minHeight: 44,
  },
  sendButton: {
    marginLeft: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default SupportChatScreen;
