import { Text, TextInput, Linking } from "react-native"
import { styles } from "./settings-styles"

interface ApiKeysSectionProperties {
  elevenLabsApiKey: string
  googleCloudApiKey: string
  onChangeElevenLabs: (value: string) => void
  onChangeGoogle: (value: string) => void
}

export function ApiKeysSection({
  elevenLabsApiKey,
  googleCloudApiKey,
  onChangeElevenLabs,
  onChangeGoogle,
}: ApiKeysSectionProperties) {
  return (
    <>
      <Text style={styles.sectionTitle}>API Keys</Text>
      <Text style={styles.fieldLabel}>ElevenLabs</Text>
      <TextInput
        style={styles.apiInput}
        secureTextEntry
        placeholder="Enter API key"
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
        Get your ElevenLabs API key
      </Text>

      <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Google Cloud</Text>
      <TextInput
        style={styles.apiInput}
        secureTextEntry
        placeholder="Enter API key"
        placeholderTextColor="#999"
        value={googleCloudApiKey}
        onChangeText={onChangeGoogle}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Text
        style={styles.linkText}
        onPress={() =>
          Linking.openURL("https://console.cloud.google.com/apis/credentials")
        }
      >
        Get your Google Cloud API key
      </Text>
    </>
  )
}
