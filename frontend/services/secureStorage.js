import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const webStorage = typeof globalThis !== "undefined" ? globalThis.localStorage : null;

export const secureStorage = {
  async getItem(key) {
    if (Platform.OS === "web") {
      return webStorage?.getItem(key) ?? null;
    }
    return SecureStore.getItemAsync(key);
  },

  async setItem(key, value) {
    if (Platform.OS === "web") {
      webStorage?.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },

  async removeItem(key) {
    if (Platform.OS === "web") {
      webStorage?.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

