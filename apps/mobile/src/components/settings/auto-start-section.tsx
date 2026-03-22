import { View, Text, Switch } from "react-native"
import { styles } from "./settings-styles"

interface AutoStartSectionProperties {
  autoStart: boolean
  onChange: (value: boolean) => void
}

export function AutoStartSection({
  autoStart,
  onChange,
}: AutoStartSectionProperties) {
  return (
    <View style={styles.autoStartRow}>
      <View>
        <Text style={styles.sectionTitle}>Auto-start</Text>
        <Text style={styles.autoStartDesc}>Start overlay on app launch</Text>
      </View>
      <Switch
        value={autoStart}
        onValueChange={onChange}
        trackColor={{ true: "#333" }}
      />
    </View>
  )
}
