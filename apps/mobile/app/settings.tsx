import { ScrollView, KeyboardAvoidingView, Platform } from "react-native"
import { useSettingsStore } from "../src/stores/settings-store"
import { ProviderSection } from "../src/components/settings/provider-section"
import { ApiKeysSection } from "../src/components/settings/api-keys-section"
import { LanguagesSection } from "../src/components/settings/languages-section"
import { AutoStartSection } from "../src/components/settings/auto-start-section"
import { styles } from "../src/components/settings/settings-styles"

function resolvePrimaryLanguage(next: string[], current: string): string {
  if (next.length === 0) return ""
  if (next.includes(current)) return current
  return next[0]
}

export default function SettingsScreen() {
  const sttProvider = useSettingsStore((state) => state.sttProvider)
  const elevenLabsApiKey = useSettingsStore((state) => state.elevenLabsApiKey)
  const googleCloudApiKey = useSettingsStore((state) => state.googleCloudApiKey)
  const languages = useSettingsStore((state) => state.languages)
  const primaryLanguage = useSettingsStore((state) => state.primaryLanguage)
  const autoStart = useSettingsStore((state) => state.autoStart)
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
        <ProviderSection
          sttProvider={sttProvider}
          onSelect={(provider) => set("sttProvider", provider)}
        />
        <ApiKeysSection
          elevenLabsApiKey={elevenLabsApiKey}
          googleCloudApiKey={googleCloudApiKey}
          onChangeElevenLabs={(value) => set("elevenLabsApiKey", value)}
          onChangeGoogle={(value) => set("googleCloudApiKey", value)}
        />
        <LanguagesSection languages={languages} onToggle={toggleLang} />
        <AutoStartSection
          autoStart={autoStart}
          onChange={(value) => set("autoStart", value)}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
