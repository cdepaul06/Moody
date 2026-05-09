import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import "react-native-url-polyfill/auto";

declare const process: { env: Record<string, string> };

// expo-secure-store is native-only; on web fall back to localStorage,
// guarded for SSR where localStorage is not available.
const webStorage = {
  getItem: (key: string) =>
    Promise.resolve(
      typeof localStorage !== "undefined" ? localStorage.getItem(key) : null,
    ),
  setItem: (key: string, value: string) =>
    Promise.resolve(
      typeof localStorage !== "undefined"
        ? localStorage.setItem(key, value)
        : undefined,
    ),
  removeItem: (key: string) =>
    Promise.resolve(
      typeof localStorage !== "undefined"
        ? localStorage.removeItem(key)
        : undefined,
    ),
};

// SecureStore has a 2048-byte limit per entry. Supabase session tokens exceed
// this, so we chunk large values across multiple keys.
const CHUNK_SIZE = 1800;

const nativeStorage = {
  async getItem(key: string): Promise<string | null> {
    const countStr = await SecureStore.getItemAsync(`${key}_count`);
    if (!countStr) return SecureStore.getItemAsync(key); // legacy single-key fallback
    const count = parseInt(countStr, 10);
    const chunks: string[] = [];
    for (let i = 0; i < count; i++) {
      const chunk = await SecureStore.getItemAsync(`${key}_chunk_${i}`);
      if (chunk == null) return null;
      chunks.push(chunk);
    }
    return chunks.join('');
  },

  async setItem(key: string, value: string): Promise<void> {
    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }
    await SecureStore.setItemAsync(`${key}_count`, String(chunks.length));
    await Promise.all(
      chunks.map((chunk, i) => SecureStore.setItemAsync(`${key}_chunk_${i}`, chunk))
    );
  },

  async removeItem(key: string): Promise<void> {
    const countStr = await SecureStore.getItemAsync(`${key}_count`);
    if (!countStr) {
      await SecureStore.deleteItemAsync(key);
      return;
    }
    const count = parseInt(countStr, 10);
    await SecureStore.deleteItemAsync(`${key}_count`);
    await Promise.all(
      Array.from({ length: count }, (_, i) => SecureStore.deleteItemAsync(`${key}_chunk_${i}`))
    );
  },
};

const storage = Platform.OS === "web" ? webStorage : nativeStorage;

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
