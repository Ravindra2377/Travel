import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../context/ThemeContext";

const { width } = Dimensions.get("window");

const SplashScreen = ({ onFinish }) => {
  const { themeColors, isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false, // Layout properties (width) don't support native driver
      }),
    ]).start();

    // Give it some time to breathe then finish
    const timer = setTimeout(() => {
      onFinish && onFinish();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.paper }]}>
      <View style={styles.container}>
        <LinearGradient
          colors={
            isDark
              ? [themeColors.paper, themeColors.paperDim]
              : ["#F7F8F7", "#E3F3EA"]
          }
          style={styles.background}
        />

        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
            },
          ]}
        >
          <Image
            source={require("../assets/icon_new.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <View style={styles.loaderContainer}>
            <View style={[styles.loaderBar, { backgroundColor: themeColors.line }]}>
              <Animated.View
                style={[
                  styles.loaderProgress,
                  { backgroundColor: themeColors.primary },
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                  },
                ]}
              />
            </View>
            <Text style={[styles.loadingText, { color: themeColors.inkSoft }]}>
              Initializing CompareZ...
            </Text>
          </View>
        </Animated.View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: themeColors.inkSoft }]}>
            Secure · Fast · Smart
          </Text>
        </View>
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
    justifyContent: "center",
    alignItems: "center",
  },
  background: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: width * 0.6,
    height: width * 0.6,
  },
  loaderContainer: {
    marginTop: 40,
    alignItems: "center",
  },
  loaderBar: {
    width: width * 0.5,
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
  },
  loaderProgress: {
    height: "100%",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 12,
    fontFamily: "FrauncesSemiBold",
    letterSpacing: 0.5,
  },
  footer: {
    position: "absolute",
    bottom: 50,
  },
  footerText: {
    fontSize: 10,
    fontFamily: "FrauncesMedium",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
});

export default SplashScreen;
