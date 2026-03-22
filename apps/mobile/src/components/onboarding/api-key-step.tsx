import { useCallback } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { useTranslation } from "react-i18next"
import { onboardingStyles as styles } from "./onboarding-styles"
import { API_KEY_SECTION_MARGIN_TOP } from "./onboarding-constants"

interface ApiKeyStepProperties {
  provider: "elevenlabs" | "google"
  setProvider: (value: "elevenlabs" | "google") => void
  elevenLabsKey: string
  setElevenLabsKey: (value: string) => void
  googleKey: string
  setGoogleKey: (value: string) => void
}

export function ApiKeyStep({
  provider,
  setProvider,
  elevenLabsKey,
  setElevenLabsKey,
  googleKey,
  setGoogleKey,
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
        <Text style={styles.providerLabel}>
          {tr("onboarding.apiKey.provider")}
        </Text>
        <ProviderToggle provider={provider} setProvider={setProvider} />
        <ElevenLabsKeyInput value={elevenLabsKey} onChange={setElevenLabsKey} />
        <GoogleKeyInput value={googleKey} onChange={setGoogleKey} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

interface ProviderToggleProperties {
  provider: "elevenlabs" | "google"
  setProvider: (value: "elevenlabs" | "google") => void
}

function ProviderToggle({
  provider,
  setProvider,
}: ProviderToggleProperties): React.JSX.Element {
  const { t: tr } = useTranslation()
  return (
    <View style={styles.providerRow}>
      <TouchableOpacity
        style={[
          styles.providerBtn,
          provider === "elevenlabs" && styles.providerBtnActive,
        ]}
        onPress={() => setProvider("elevenlabs")}
      >
        <Text
          style={[
            styles.providerBtnText,
            provider === "elevenlabs" && styles.providerBtnTextActive,
          ]}
        >
          {tr("settings.fieldElevenLabs")}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.providerBtn,
          provider === "google" && styles.providerBtnActive,
        ]}
        onPress={() => setProvider("google")}
      >
        <Text
          style={[
            styles.providerBtnText,
            provider === "google" && styles.providerBtnTextActive,
          ]}
        >
          {tr("settings.fieldGoogle")}
        </Text>
      </TouchableOpacity>
    </View>
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

function GoogleKeyInput({
  value,
  onChange,
}: KeyInputProperties): React.JSX.Element {
  const { t: tr } = useTranslation()
  const handleOpenLink = useCallback(() => {
    Linking.openURL("https://console.cloud.google.com/apis/credentials")
  }, [])

  return (
    <>
      <Text
        style={[styles.fieldLabel, { marginTop: API_KEY_SECTION_MARGIN_TOP }]}
      >
        {tr("onboarding.apiKey.googleLabel")}
      </Text>
      <TextInput
        style={styles.apiInput}
        secureTextEntry
        placeholder={tr("onboarding.apiKey.googlePlaceholder")}
        placeholderTextColor="#999"
        value={value}
        onChangeText={onChange}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Text style={styles.linkText} onPress={handleOpenLink}>
        {tr("onboarding.apiKey.googleLink")}
      </Text>
    </>
  )
}
