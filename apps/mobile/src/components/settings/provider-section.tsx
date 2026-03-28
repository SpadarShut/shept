import { View, Text, Switch } from "react-native"
import { useTranslation } from "react-i18next"
import { styles } from "./settings-styles"

interface RealtimeToggleSectionProperties {
  realtimeMode: boolean
  onChange: (value: boolean) => void
}

export function RealtimeToggleSection({
  realtimeMode,
  onChange,
}: RealtimeToggleSectionProperties) {
  const { t: tr } = useTranslation()
  return (
    <View>
      <Text style={styles.sectionTitle}>{tr("settings.realtimeMode")}</Text>
      <View style={styles.autoStartRow}>
        <View style={{ flexShrink: 1, gap: 8 }}>
          <Text style={styles.fieldLabel}>
            {tr("settings.realtimeModeLabel")}
          </Text>
          <Text style={styles.autoStartDesc}>
            {tr("settings.realtimeModeDesc")}
          </Text>
        </View>
        <Switch value={realtimeMode} onValueChange={onChange} />
      </View>
    </View>
  )
}
