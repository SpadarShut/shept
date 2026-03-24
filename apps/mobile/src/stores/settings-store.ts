import { create } from "zustand"
import * as SecureStore from "expo-secure-store"
import { Platform } from "react-native"
import SheptNative from "../../modules/shept-native"

const STORE_KEY = "shept-settings"

export interface SheptSettings {
  realtimeMode: boolean
  elevenLabsApiKey: string
  languages: string[]
  primaryLanguage: string
  autoStart: boolean
  onboardingComplete: boolean
  appLanguage: "system" | "en" | "be"
}

interface SettingsStore extends SheptSettings {
  hydrated: boolean
  hydrate: () => Promise<void>
  set: <K extends keyof SheptSettings>(key: K, value: SheptSettings[K]) => void
  setMany: (partial: Partial<SheptSettings>) => void
}

const defaults: SheptSettings = {
  realtimeMode: true,
  elevenLabsApiKey: "",
  languages: [],
  primaryLanguage: "",
  autoStart: true,
  onboardingComplete: false,
  appLanguage: "system",
}

function saveToNative(json: string) {
  if (Platform.OS === "android") {
    try {
      SheptNative.saveSettings(json)
    } catch {}
  }
}

function persist(state: SheptSettings) {
  const data: SheptSettings = {
    realtimeMode: state.realtimeMode,
    elevenLabsApiKey: state.elevenLabsApiKey,
    languages: state.languages,
    primaryLanguage: state.primaryLanguage,
    autoStart: state.autoStart,
    onboardingComplete: state.onboardingComplete,
    appLanguage: state.appLanguage,
  }
  const json = JSON.stringify(data)
  SecureStore.setItemAsync(STORE_KEY, json).catch(() => {})
  saveToNative(json)
}

export const useSettingsStore = create<SettingsStore>()(
  (setState, getState) => ({
    ...defaults,
    hydrated: false,

    hydrate: async () => {
      try {
        let raw: string | undefined
        let fromSecureStore = false

        if (Platform.OS === "android") {
          try {
            raw = SheptNative.getSettings() ?? undefined
          } catch {
            raw = undefined
          }
        }

        if (!raw) {
          raw = (await SecureStore.getItemAsync(STORE_KEY)) ?? undefined
          if (raw) fromSecureStore = true
        }

        if (raw) {
          const parsed = JSON.parse(raw) as Partial<SheptSettings>
          setState({ ...defaults, ...parsed, hydrated: true })
          if (fromSecureStore) saveToNative(raw)
        } else {
          setState({ hydrated: true })
        }
      } catch {
        setState({ hydrated: true })
      }
    },

    set: (key, value) => {
      setState({ [key]: value })
      const next = { ...getState(), [key]: value }
      persist(next)
    },

    setMany: (partial) => {
      setState(partial)
      const next = { ...getState(), ...partial }
      persist(next)
    },
  }),
)
