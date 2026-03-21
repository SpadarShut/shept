import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import SheptNative from "../../modules/shept-native";

const STORE_KEY = "shept-settings";

export interface SheptSettings {
  sttProvider: "elevenlabs" | "google";
  elevenLabsApiKey: string;
  googleCloudApiKey: string;
  languages: string[];
  primaryLanguage: string;
  autoStart: boolean;
  onboardingComplete: boolean;
}

interface SettingsStore extends SheptSettings {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  set: <K extends keyof SheptSettings>(key: K, value: SheptSettings[K]) => void;
  setMany: (partial: Partial<SheptSettings>) => void;
}

const defaults: SheptSettings = {
  sttProvider: "elevenlabs",
  elevenLabsApiKey: "",
  googleCloudApiKey: "",
  languages: [],
  primaryLanguage: "",
  autoStart: false,
  onboardingComplete: false,
};

function persist(state: SheptSettings) {
  const data: SheptSettings = {
    sttProvider: state.sttProvider,
    elevenLabsApiKey: state.elevenLabsApiKey,
    googleCloudApiKey: state.googleCloudApiKey,
    languages: state.languages,
    primaryLanguage: state.primaryLanguage,
    autoStart: state.autoStart,
    onboardingComplete: state.onboardingComplete,
  };
  const json = JSON.stringify(data);
  SecureStore.setItemAsync(STORE_KEY, json).catch(console.error);
  if (Platform.OS === "android") {
    try {
      SheptNative.saveSettings(json);
    } catch (e) {
      console.error("Failed to save to SharedPreferences", e);
    }
  }
}

export const useSettingsStore = create<SettingsStore>()((setState, getState) => ({
  ...defaults,
  hydrated: false,

  hydrate: async () => {
    try {
      let raw: string | null = null;

      // Try SharedPreferences first on Android
      if (Platform.OS === "android") {
        try {
          raw = SheptNative.getSettings();
        } catch {
          // fall through to SecureStore
        }
      }

      // Fall back to SecureStore
      if (!raw) {
        raw = await SecureStore.getItemAsync(STORE_KEY);
      }

      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SheptSettings>;
        setState({ ...defaults, ...parsed, hydrated: true });
      } else {
        setState({ hydrated: true });
      }
    } catch {
      setState({ hydrated: true });
    }
  },

  set: (key, value) => {
    setState({ [key]: value });
    const next = { ...getState(), [key]: value };
    persist(next);
  },

  setMany: (partial) => {
    setState(partial);
    const next = { ...getState(), ...partial };
    persist(next);
  },
}));
