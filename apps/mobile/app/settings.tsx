import { ScrollView, KeyboardAvoidingView, Platform } from "react-native"
import { useSettingsStore } from "../src/stores/settings-store"
import { RealtimeToggleSection } from "../src/components/settings/provider-section"
import { ApiKeysSection } from "../src/components/settings/api-keys-section"
import { LanguagesSection } from "../src/components/settings/languages-section"
import { AppLanguageSection } from "../src/components/settings/app-language-section"
import { styles } from "../src/components/settings/settings-styles"

function resolvePrimaryLanguage(next: string[], current: string): string {
  if (next.length === 0) return ""
  if (next.includes(current)) return current
  return next[0]
}

export default function SettingsScreen() {
  const realtimeMode = useSettingsStore((state) => state.realtimeMode)
  const elevenLabsApiKey = useSettingsStore((state) => state.elevenLabsApiKey)
  const languages = useSettingsStore((state) => state.languages)
  const primaryLanguage = useSettingsStore((state) => state.primaryLanguage)
  const appLanguage = useSettingsStore((state) => state.appLanguage)
  const set = useSettingsStore((state) => state.set)
  const setMany = useSettingsStore((state) => state.setMany)

  const toggleLang = (code: string) => {
    const next = languages.includes(code)
      ? languages.filter((current) => current !== code)
      : [...languages, code]
    const primary = resolvePrimaryLanguage(next, primaryLanguage)
    setMany({ languages: next, primaryLanguage: primary })
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <AppLanguageSection
          appLanguage={appLanguage}
          onChange={(value) => set("appLanguage", value)}
        />

        <ApiKeysSection
          elevenLabsApiKey={elevenLabsApiKey}
          onChangeElevenLabs={(value) => set("elevenLabsApiKey", value)}
        />

        <RealtimeToggleSection
          realtimeMode={realtimeMode}
          onChange={(value) => set("realtimeMode", value)}
        />

        <LanguagesSection languages={languages} onToggle={toggleLang} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
