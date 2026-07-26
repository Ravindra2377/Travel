import AsyncStorage from "@react-native-async-storage/async-storage";
import { secureStorage } from "./secureStorage";

const INDEX_KEY = "comparez.platformTokens.index.v1";
const TOKEN_PREFIX = "comparez.platformTokens.v1.";
const LEGACY_KEY = "userTokens";

const normalizePlatform = (platform) =>
  String(platform || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "");

async function getIndex() {
  const raw = await secureStorage.getItem(INDEX_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    await secureStorage.removeItem(INDEX_KEY);
    return [];
  }
}

async function setIndex(platforms) {
  const unique = [...new Set(platforms.map(normalizePlatform).filter(Boolean))];
  if (unique.length === 0) {
    await secureStorage.removeItem(INDEX_KEY);
    return;
  }
  await secureStorage.setItem(INDEX_KEY, JSON.stringify(unique));
}

async function migrateLegacyTokensIfNeeded() {
  const existingIndex = await getIndex();
  if (existingIndex.length > 0) return;

  const legacyRaw = await AsyncStorage.getItem(LEGACY_KEY);
  if (!legacyRaw) return;

  try {
    const legacy = JSON.parse(legacyRaw);
    for (const [platform, tokens] of Object.entries(legacy || {})) {
      if (tokens && typeof tokens === "object") {
        await platformTokenStorage.setPlatform(platform, tokens);
      }
    }
    await AsyncStorage.removeItem(LEGACY_KEY);
  } catch {
    // Invalid plaintext credentials must not remain on disk.
    await AsyncStorage.removeItem(LEGACY_KEY);
  }
}

export const platformTokenStorage = {
  async getAll() {
    await migrateLegacyTokensIfNeeded();
    const platforms = await getIndex();
    const result = {};

    await Promise.all(
      platforms.map(async (platform) => {
        const raw = await secureStorage.getItem(`${TOKEN_PREFIX}${platform}`);
        if (!raw) return;
        try {
          const tokens = JSON.parse(raw);
          if (tokens && typeof tokens === "object") {
            result[platform] = tokens;
          }
        } catch {
          await secureStorage.removeItem(`${TOKEN_PREFIX}${platform}`);
        }
      }),
    );

    return result;
  },

  async setPlatform(platform, tokens) {
    const safePlatform = normalizePlatform(platform);
    if (!safePlatform || !tokens || typeof tokens !== "object") {
      throw new Error("Invalid platform credentials");
    }
    await secureStorage.setItem(
      `${TOKEN_PREFIX}${safePlatform}`,
      JSON.stringify(tokens),
    );
    const platforms = await getIndex();
    await setIndex([...platforms, safePlatform]);
  },

  async removePlatform(platform) {
    const safePlatform = normalizePlatform(platform);
    if (!safePlatform) return;
    await secureStorage.removeItem(`${TOKEN_PREFIX}${safePlatform}`);
    const platforms = await getIndex();
    await setIndex(platforms.filter((item) => item !== safePlatform));
  },

  async clear() {
    const platforms = await getIndex();
    await Promise.all(
      platforms.map((platform) =>
        secureStorage.removeItem(`${TOKEN_PREFIX}${platform}`),
      ),
    );
    await secureStorage.removeItem(INDEX_KEY);
    await AsyncStorage.removeItem(LEGACY_KEY);
  },
};

