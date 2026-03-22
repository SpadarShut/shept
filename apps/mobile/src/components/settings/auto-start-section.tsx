import { View, Text, Switch } from "react-native"
import { useTranslation } from "react-i18next"
import { styles } from "./settings-styles"

interface AutoStartSectionProperties {
  autoStart: boolean
  onChange: (value: boolean) => void
}

export function AutoStartSection({
  autoStart,
  onChange,
}: AutoStartSectionProperties) {
  const { t: tr } = useTranslation()
  return (
    <View style={styles.autoStartRow}>
      <View>
        <Text style={styles.sectionTitle}>{tr("settings.autoStart")}</Text>
        <Text style={styles.autoStartDesc}>{tr("settings.autoStartDesc")}</Text>
      </View>
      <Switch
        value={autoStart}
        onValueChange={onChange}
        trackColor={{ true: "#333" }}
      />
    </View>
  )
}
