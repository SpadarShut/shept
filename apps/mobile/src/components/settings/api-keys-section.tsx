import { Text, TextInput, Linking } from "react-native"
import { useTranslation } from "react-i18next"
import { styles } from "./settings-styles"

interface ApiKeysSectionProperties {
  elevenLabsApiKey: string
  onChangeElevenLabs: (value: string) => void
}

interface SingleKeyInputProperties {
  value: string
  onChange: (value: string) => void
}

function ElevenLabsKeyInput({ value, onChange }: SingleKeyInputProperties) {
  const { t: tr } = useTranslation()
  return (
    <>
      <Text style={styles.fieldLabel}>{tr("settings.fieldElevenLabs")}</Text>
      <TextInput
        style={styles.apiInput}
        secureTextEntry
        placeholder={tr("settings.enterApiKey")}
        placeholderTextColor="#999"
        value={value}
        onChangeText={onChange}
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

export function ApiKeysSection({
  elevenLabsApiKey,
  onChangeElevenLabs,
}: ApiKeysSectionProperties) {
  const { t: tr } = useTranslation()
  return (
    <>
      <Text style={styles.sectionTitle}>{tr("settings.apiKeys")}</Text>
      <ElevenLabsKeyInput
        value={elevenLabsApiKey}
        onChange={onChangeElevenLabs}
      />
    </>
  )
}
