import { create } from "zustand"
import * as SecureStore from "expo-secure-store"
import { Platform } from "react-native"
import SheptNative from "../../modules/shept-native"

const STORE_KEY = "shept-settings"

export interface SheptSettings {
  sttProvider: "elevenlabs" | "google"
  elevenLabsApiKey: string
  googleCloudApiKey: string
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
  sttProvider: "elevenlabs",
  elevenLabsApiKey: "",
  googleCloudApiKey: "",
  languages: [],
  primaryLanguage: "",
  autoStart: true,
  onboardingComplete: false,
  appLanguage: "system",
}

function persist(state: SheptSettings) {
  const data: SheptSettings = {
    sttProvider: state.sttProvider,
    elevenLabsApiKey: state.elevenLabsApiKey,
    googleCloudApiKey: state.googleCloudApiKey,
    languages: state.languages,
    primaryLanguage: state.primaryLanguage,
    autoStart: state.autoStart,
    onboardingComplete: state.onboardingComplete,
    appLanguage: state.appLanguage,
  }
  const json = JSON.stringify(data)
  SecureStore.setItemAsync(STORE_KEY, json).catch(() => {})
  if (Platform.OS === "android") {
    try {
      SheptNative.saveSettings(json)
    } catch {}
  }
}

export const useSettingsStore = create<SettingsStore>()(
  (setState, getState) => ({
    ...defaults,
    hydrated: false,

    hydrate: async () => {
      try {
        let raw: string | undefined

        if (Platform.OS === "android") {
          try {
            raw = SheptNative.getSettings() ?? undefined
          } catch {
            raw = undefined
          }
        }

        if (!raw) {
          raw = (await SecureStore.getItemAsync(STORE_KEY)) ?? undefined
        }

        if (raw) {
          const parsed = JSON.parse(raw) as Partial<SheptSettings>
          setState({ ...defaults, ...parsed, hydrated: true })
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
