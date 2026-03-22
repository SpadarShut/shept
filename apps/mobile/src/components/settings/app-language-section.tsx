import { View, Text, TouchableOpacity } from "react-native"
import i18next from "i18next"
import { useTranslation } from "react-i18next"
import { systemLng } from "../../i18n"
import type { SheptSettings } from "../../stores/settings-store"
import { styles } from "./settings-styles"

interface AppLanguageSectionProperties {
  appLanguage: SheptSettings["appLanguage"]
  onChange: (value: SheptSettings["appLanguage"]) => void
}

const OPTIONS: Array<{
  value: SheptSettings["appLanguage"]
  labelKey: string
}> = [
  { value: "system", labelKey: "settings.appLanguageSystem" },
  { value: "en", labelKey: "settings.appLanguageEnglish" },
  { value: "be", labelKey: "settings.appLanguageBelarusian" },
]

export function AppLanguageSection({
  appLanguage,
  onChange,
}: AppLanguageSectionProperties) {
  const { t: tr } = useTranslation()

  const handleSelect = (value: SheptSettings["appLanguage"]) => {
    onChange(value)
    const lng = value === "system" ? systemLng : value
    i18next.changeLanguage(lng).catch(() => {})
  }

  return (
    <>
      <Text style={[styles.sectionTitle, { marginTop: 32 }]}>
        {tr("settings.appLanguage")}
      </Text>
      <View style={styles.providerRow}>
        {OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.providerBtn,
              appLanguage === option.value && styles.providerBtnActive,
            ]}
            onPress={() => handleSelect(option.value)}
          >
            <Text
              style={[
                styles.providerBtnText,
                appLanguage === option.value && styles.providerBtnTextActive,
              ]}
            >
              {tr(option.labelKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  )
}
