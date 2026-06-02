import React, { createContext, useState, useEffect } from "react";
import { Platform, Alert } from "react-native";
import axios from "axios";
import { API_URL } from "../config/api";
import * as SecureStore from "expo-secure-store";

// Platform-aware token storage
const tokenStorage = {
  getItem: async (key) => {
    if (Platform.OS === "web") {
      return localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key, value) => {
    if (Platform.OS === "web") {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key) => {
    if (Platform.OS === "web") {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [user, setUser] = useState(null);

  const login = async (email, password) => {
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();
    const normalizedPassword = String(password || "");

    if (!normalizedEmail || !normalizedPassword) {
      Alert.alert("Missing details", "Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/login`, {
        email: normalizedEmail,
        password: normalizedPassword,
      });
      const { token, user: userData } = response.data;
      setUserToken(token);
      setUser(userData);
      await tokenStorage.setItem("userToken", token);
      await tokenStorage.setItem("userData", JSON.stringify(userData));
    } catch (e) {
      console.log("[Auth] Login Error:", {
        status: e?.response?.status,
        data: e?.response?.data,
        message: e?.message
      });
      const statusCode = e?.response?.status;
      const serverError = e?.response?.data?.error;

      if (statusCode === 401) {
        Alert.alert(
          "Invalid credentials",
          "Email or password is incorrect. If you are new, create an account first.",
        );
      } else {
        Alert.alert(
          "Login failed",
          serverError || `Unable to sign in (Error ${statusCode || 'Network'}).`,
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name, email, password) => {
    const normalizedName = String(name || "").trim();
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();
    const normalizedPassword = String(password || "");

    if (!normalizedName || !normalizedEmail || !normalizedPassword) {
      Alert.alert("Missing details", "Please enter your name, email and password.");
      return;
    }

    setIsLoading(true);
    console.log(`[Auth] Attempting Register at: ${API_URL}/register`);
    try {
      const response = await axios.post(`${API_URL}/register`, {
        name: normalizedName,
        email: normalizedEmail,
        password: normalizedPassword,
      });
      console.log(`[Auth] Register Response:`, response.status);
      const { token, user: userData } = response.data;
      setUserToken(token);
      setUser(userData);
      await tokenStorage.setItem("userToken", token);
      await tokenStorage.setItem("userData", JSON.stringify(userData));
    } catch (e) {
      console.log("[Auth] Registration Error:", {
        status: e?.response?.status,
        data: e?.response?.data,
        message: e?.message
      });
      const statusCode = e?.response?.status;
      const serverError = e?.response?.data?.error;

      if (statusCode === 409) {
        Alert.alert(
          "Account exists",
          "This email is already registered. Please sign in instead.",
        );
      } else {
        Alert.alert(
          "Registration failed",
          serverError || `Unable to create account (Error ${statusCode || 'Network'}).`,
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    setUserToken(null);
    setUser(null);
    await tokenStorage.removeItem("userToken");
    await tokenStorage.removeItem("userData");
    setIsLoading(false);
  };

  const isLoggedIn = async () => {
    try {
      setIsLoading(true);
      let token = await tokenStorage.getItem("userToken");
      let userData = await tokenStorage.getItem("userData");
      setUserToken(token);
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (e) {
      console.log("isLoggedIn error:", e?.message || e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    isLoggedIn();
  }, []);

  return (
    <AuthContext.Provider
      value={{ login, logout, register, isLoading, userToken, user }}
    >
      {children}
    </AuthContext.Provider>
  );
};
