import { View, Text, TouchableOpacity } from "react-native"
import type { SheptSettings } from "../../stores/settings-store"
import { styles } from "./settings-styles"

interface ProviderSectionProperties {
  sttProvider: SheptSettings["sttProvider"]
  onSelect: (provider: SheptSettings["sttProvider"]) => void
}

export function ProviderSection({
  sttProvider,
  onSelect,
}: ProviderSectionProperties) {
  return (
    <>
      <Text style={styles.sectionTitle}>Provider</Text>
      <View style={styles.providerRow}>
        <TouchableOpacity
          style={[
            styles.providerBtn,
            sttProvider === "elevenlabs" && styles.providerBtnActive,
          ]}
          onPress={() => onSelect("elevenlabs")}
        >
          <Text
            style={[
              styles.providerBtnText,
              sttProvider === "elevenlabs" && styles.providerBtnTextActive,
            ]}
          >
            ElevenLabs
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.providerBtn,
            sttProvider === "google" && styles.providerBtnActive,
          ]}
          onPress={() => onSelect("google")}
        >
          <Text
            style={[
              styles.providerBtnText,
              sttProvider === "google" && styles.providerBtnTextActive,
            ]}
          >
            Google Cloud
          </Text>
        </TouchableOpacity>
      </View>
    </>
  )
}
