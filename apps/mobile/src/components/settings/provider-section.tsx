import { View, Text, TouchableOpacity } from "react-native"
import { useTranslation } from "react-i18next"
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
  const { t: tr } = useTranslation()
  return (
    <>
      <Text style={styles.sectionTitle}>{tr("settings.provider")}</Text>
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
            {tr("settings.fieldElevenLabs")}
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
            {tr("settings.fieldGoogle")}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  )
}
