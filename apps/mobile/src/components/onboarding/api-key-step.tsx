import { useCallback } from "react"
import {
  Text,
  TextInput,
  ScrollView,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { useTranslation } from "react-i18next"
import { onboardingStyles as styles } from "./onboarding-styles"

interface ApiKeyStepProperties {
  elevenLabsKey: string
  setElevenLabsKey: (value: string) => void
}

export function ApiKeyStep({
  elevenLabsKey,
  setElevenLabsKey,
}: ApiKeyStepProperties): React.JSX.Element {
  const { t: tr } = useTranslation()
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.flex1}
    >
      <ScrollView
        style={styles.flex1}
        contentContainerStyle={styles.stepContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.stepTitle}>{tr("onboarding.apiKey.title")}</Text>
        <ElevenLabsKeyInput value={elevenLabsKey} onChange={setElevenLabsKey} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

interface KeyInputProperties {
  value: string
  onChange: (value: string) => void
}

function ElevenLabsKeyInput({
  value,
  onChange,
}: KeyInputProperties): React.JSX.Element {
  const { t: tr } = useTranslation()
  const handleOpenLink = useCallback(() => {
    Linking.openURL("https://elevenlabs.io/app/settings/api-keys")
  }, [])

  return (
    <>
      <Text style={styles.fieldLabel}>
        {tr("onboarding.apiKey.elevenLabsLabel")}
      </Text>
      <TextInput
        style={styles.apiInput}
        secureTextEntry
        placeholder={tr("onboarding.apiKey.elevenLabsPlaceholder")}
        placeholderTextColor="#999"
        value={value}
        onChangeText={onChange}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Text style={styles.linkText} onPress={handleOpenLink}>
        {tr("onboarding.apiKey.elevenLabsLink")}
      </Text>
    </>
  )
}
