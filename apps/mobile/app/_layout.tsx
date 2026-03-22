import "../src/i18n"

import { useEffect } from "react"
import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import i18next from "i18next"
import { useTranslation } from "react-i18next"
import { systemLng } from "../src/i18n"
import { useSettingsStore } from "../src/stores/settings-store"

export default function RootLayout() {
  const { t: tr } = useTranslation()
  const appLanguage = useSettingsStore((state) => state.appLanguage)
  const hydrated = useSettingsStore((state) => state.hydrated)

  useEffect(() => {
    if (!hydrated) return
    const lng = appLanguage === "system" ? systemLng : appLanguage
    if (i18next.language !== lng) {
      i18next.changeLanguage(lng).catch(() => {})
    }
  }, [appLanguage, hydrated])

  return (
    <>
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen name="index" options={{ title: tr("nav.shept") }} />
        <Stack.Screen name="settings" options={{ title: tr("nav.settings") }} />
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false, gestureEnabled: false }}
        />
      </Stack>
    </>
  )
}
