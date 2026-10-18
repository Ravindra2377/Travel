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
