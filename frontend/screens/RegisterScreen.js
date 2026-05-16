import React, { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { AuthContext } from "../context/AuthContext";
import { COLORS, SPACING, RADIUS, FONTS } from "../config/theme";
import { AppButton, SurfaceCard, TextField } from "../components/SharedUI";

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const { register } = useContext(AuthContext);

  const handleRegister = () => {
    if (!name.trim()) {
      alert("Please enter your name");
      return;
    }

    // Password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,16}$/;
    
    if (password.length < 8 || password.length > 16) {
      alert("Password must be between 8 and 16 characters");
      return;
    }

    if (!/[A-Z]/.test(password)) {
      alert("Password must contain at least one uppercase letter");
      return;
    }
    if (!/[a-z]/.test(password)) {
      alert("Password must contain at least one lowercase letter");
      return;
    }
    if (!/\d/.test(password)) {
      alert("Password must contain at least one number");
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      alert("Password must contain at least one special character");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    register(name, email, password);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>


      <LinearGradient colors={COLORS.gradientHero} style={styles.heroBg} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textOnDark} />
        </TouchableOpacity>

        <Text style={styles.heading}>Create Account</Text>
        <Text style={styles.subtitle}>Join CompareZ and start saving</Text>

        <SurfaceCard style={styles.formCard}>
          <TextField
            icon="person-outline"
            value={name}
            onChangeText={setName}
            placeholder="Full Name"
          />

          <TextField
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
            placeholder="Email address"
            keyboardType="email-address"
          />

          <TextField
            icon="lock-closed-outline"
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry={!showPassword}
            rightAccessory={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={COLORS.textTertiary}
                />
              </TouchableOpacity>
            }
          />

          <TextField
            icon="shield-checkmark-outline"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm password"
            secureTextEntry={true}
          />

          <View style={styles.termsRow}>
            <TouchableOpacity 
              style={styles.checkbox}
              onPress={() => setAgreed(!agreed)}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={agreed ? "checkbox" : "square-outline"} 
                size={22} 
                color={agreed ? COLORS.textAccent : COLORS.textTertiary} 
              />
            </TouchableOpacity>
            <View style={styles.termsTextWrap}>
              <Text style={styles.termsText}>I agree to the </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Terms")}>
                <Text style={styles.termsLink}>Terms & Conditions</Text>
              </TouchableOpacity>
            </View>
          </View>

          <AppButton
            label="Create Account"
            onPress={handleRegister}
            icon="person-add-outline"
            style={[styles.createBtn, !agreed && { opacity: 0.5 }]}
            disabled={!agreed}
          />

          <View style={styles.signInRow}>
            <Text style={styles.signInPrompt}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </SurfaceCard>
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
    backgroundColor: COLORS.backgroundDark,
  },
  heroBg: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.28,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: SPACING.xxl,
  },
  backBtn: {
    marginBottom: SPACING.xxxl,
  },
  heading: {
    ...FONTS.luxury,
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...FONTS.luxurySub,
    marginBottom: SPACING.xxl,
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
  },
  createBtn: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.xxl,
  },
  signInRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signInPrompt: {
    ...FONTS.body,
  },
  signInLink: {
    ...FONTS.bodyBold,
    color: COLORS.textAccent,
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.xs,
  },
  checkbox: {
    marginRight: SPACING.sm,
  },
  termsTextWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  termsText: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
  },
  termsLink: {
    ...FONTS.captionBold,
    color: COLORS.textAccent,
    textDecorationLine: "underline",
  },
});

export default RegisterScreen;
