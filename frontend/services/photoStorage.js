import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";

const PHOTOS_DIR = `${FileSystem.documentDirectory || ""}trip_moments/photos/`;

export const photoStorage = {
  /**
   * Ensure local photos directory exists
   */
  async init() {
    if (Platform.OS === "web" || !FileSystem.documentDirectory) return;
    try {
      const dirInfo = await FileSystem.getInfoAsync(PHOTOS_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });
      }
    } catch (e) {
      console.warn("[photoStorage] Directory init error:", e);
    }
  },

  /**
   * Persist temporary photo (from ImagePicker or camera) into permanent document storage
   */
  async persistPhoto(sourceUri) {
    if (!sourceUri) return null;

    // If on web or remote HTTP URL, return as-is
    if (
      Platform.OS === "web" ||
      sourceUri.startsWith("http://") ||
      sourceUri.startsWith("https://") ||
      sourceUri.startsWith("data:")
    ) {
      return sourceUri;
    }

    try {
      await this.init();
      const ext = sourceUri.split(".").pop() || "jpg";
      const filename = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
      const targetUri = `${PHOTOS_DIR}${filename}`;

      await FileSystem.copyAsync({
        from: sourceUri,
        to: targetUri,
      });

      return targetUri;
    } catch (err) {
      console.error("[photoStorage] Failed to persist photo; using source URI:", err);
      return sourceUri;
    }
  },

  /**
   * Upload local photo file to cloud server and return the hosted public URL
   */
  async uploadPhoto(fileUri, endpointUrl = null, syncKey = null) {
    if (!fileUri) return null;
    if (fileUri.startsWith("http://") || fileUri.startsWith("https://")) {
      return fileUri;
    }

    const targetUrl =
      endpointUrl ||
      (typeof process !== "undefined" &&
        (process.env?.EXPO_PUBLIC_PHOTO_UPLOAD_ENDPOINT ||
          process.env?.PHOTO_UPLOAD_ENDPOINT)) ||
      "http://localhost:3001/api/photos/upload";

    const key =
      syncKey ||
      (typeof process !== "undefined" &&
        (process.env?.EXPO_PUBLIC_SYNC_KEY || process.env?.SYNC_KEY)) ||
      "dev-sync-token-secret";

    try {
      let base64Data = null;
      if (Platform.OS === "web") {
        if (fileUri.startsWith("data:")) {
          base64Data = fileUri.split(",").pop();
        } else {
          return fileUri;
        }
      } else {
        base64Data = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      if (!base64Data) return fileUri;

      const response = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          base64Data,
          filename: fileUri.split("/").pop(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.url || fileUri;
      } else {
        console.warn(`[photoStorage] Upload failed with HTTP ${response.status}`);
        return fileUri;
      }
    } catch (err) {
      console.warn("[photoStorage] Photo upload error; retaining local URI:", err);
      return fileUri;
    }
  },

  /**
   * Delete photo from local document storage
   */
  async deletePhoto(fileUri) {
    if (!fileUri || Platform.OS === "web") return;
    try {
      if (fileUri.startsWith(PHOTOS_DIR)) {
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(fileUri, { idempotent: true });
        }
      }
    } catch (err) {
      console.warn("[photoStorage] Failed to delete photo file:", err);
    }
  },
};

export default photoStorage;
