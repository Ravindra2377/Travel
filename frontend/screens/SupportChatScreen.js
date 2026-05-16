import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, SPACING, RADIUS, SHADOWS, FONTS } from "../config/theme";
import * as Haptics from "expo-haptics";
import GroqService from "../services/GroqService";

const SupportChatScreen = ({ navigation }) => {
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
  // Conversation history for multi-turn AI context [{role, content}]
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

    // Build conversation history for Groq (keep last 20 turns)
    const newHistory = [
      ...historyRef.current,
      { role: "user", content: userText },
    ].slice(-20);
    historyRef.current = newHistory;

    try {
      const reply = await GroqService.chat(newHistory);
      historyRef.current = [...historyRef.current, { role: "assistant", content: reply }];

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
      console.log("[SupportChat] Groq error:", e.message);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          text: "I'm having trouble connecting right now. Please try again in a moment! 🔄",
          sender: "support",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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
          <View style={styles.supportAvatar}>
            <Ionicons name="headset" size={14} color="#FFF" />
          </View>
        )}
        <View
          style={[
            styles.bubble,
            isUser ? styles.userBubble : styles.supportBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userText : styles.supportText,
            ]}
          >
            {item.text}
          </Text>
          <Text
            style={[
              styles.timeText,
              isUser ? styles.userTime : styles.supportTime,
            ]}
          >
            {item.time}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />

        {/* Header */}
        <LinearGradient colors={COLORS.gradientHero} style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Support Chat</Text>
            <View style={styles.onlineStatus}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Online</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={
            isTyping ? (
              <View style={[styles.messageRow, styles.supportRow]}>
                <View style={styles.supportAvatar}>
                  <Ionicons name="sparkles" size={14} color="#FFF" />
                </View>
                <View style={[styles.bubble, styles.supportBubble, styles.typingBubble]}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={[styles.messageText, styles.supportText, { marginLeft: 8 }]}>
                    AI is thinking...
                  </Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* Input */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Type your message..."
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
                placeholderTextColor={COLORS.textTertiary}
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={sendMessage}
                disabled={inputText.trim().length === 0}
              >
                <LinearGradient
                  colors={
                    inputText.trim().length > 0
                      ? [COLORS.primary, COLORS.accent]
                      : ["#E2E8F0", "#E2E8F0"]
                  }
                  style={styles.sendGradient}
                >
                  <Ionicons name="send" size={18} color="#FFF" />
                </LinearGradient>
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
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    flexDirection: "row",
    alignItems: "center",
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
    ...SHADOWS.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    ...FONTS.h3Dark,
    fontSize: 18,
    color: "#FFF",
  },
  onlineStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
    marginRight: 6,
  },
  statusText: {
    ...FONTS.captionDark,
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: SPACING.lg,
    alignItems: "flex-end",
  },
  userRow: {
    justifyContent: "flex-end",
  },
  supportRow: {
    justifyContent: "flex-start",
  },
  supportAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    marginBottom: 4,
  },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    ...SHADOWS.sm,
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  supportBubble: {
    backgroundColor: "#FFF",
    borderBottomLeftRadius: 4,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
  },
  messageText: {
    ...FONTS.body,
    fontSize: 15,
  },
  userText: {
    color: "#FFF",
  },
  supportText: {
    color: COLORS.textPrimary,
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  userTime: {
    color: "rgba(255,255,255,0.7)",
  },
  supportTime: {
    color: COLORS.textTertiary,
  },
  inputContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: Platform.OS === "ios" ? 32 : SPACING.md,
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
    maxHeight: 100,
    paddingVertical: 10,
    ...FONTS.body,
    color: COLORS.textPrimary,
  },
  sendButton: {
    marginLeft: 8,
    marginBottom: 4,
  },
  sendGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default SupportChatScreen;
