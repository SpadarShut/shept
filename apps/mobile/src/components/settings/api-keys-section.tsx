import { Text, TextInput, Linking } from "react-native"
import { useTranslation } from "react-i18next"
import { styles } from "./settings-styles"

interface ApiKeysSectionProperties {
  elevenLabsApiKey: string
  onChangeElevenLabs: (value: string) => void
}

export function ApiKeysSection({
  elevenLabsApiKey,
  onChangeElevenLabs,
}: ApiKeysSectionProperties) {
  const { t: tr } = useTranslation()
  return (
    <>
      <Text style={styles.sectionTitle}>{tr("settings.apiKeys")}</Text>
      <TextInput
        style={styles.apiInput}
        secureTextEntry
        placeholder={tr("settings.enterApiKey")}
        placeholderTextColor="#999"
        value={elevenLabsApiKey}
        onChangeText={onChangeElevenLabs}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Text
        style={styles.linkText}
        onPress={() =>
          Linking.openURL("https://elevenlabs.io/app/settings/api-keys")
        }
      >
        {tr("settings.getElevenLabsKey")}
      </Text>
    </>
  )
}
