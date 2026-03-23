import { View, Text, Animated, Switch } from "react-native"
import { useTranslation } from "react-i18next"

import { homeScreenStyles as styles } from "../styles/home-screen-styles"

interface ServiceStatusCardProperties {
  statusLabel: string
  dotColor: string
  serviceStatus: string
  serviceRunning: boolean
  pulseAnimation: Animated.Value
  onToggleService: () => void
}

export function ServiceStatusCard(properties: ServiceStatusCardProperties) {
  const { t: tr } = useTranslation()
  return (
    <View style={styles.statusBox}>
      <View style={styles.statusHeader}>
        <Text style={styles.statusLabel}>{tr("home.serviceStatus")}</Text>
        <Switch
          value={properties.serviceRunning}
          onValueChange={properties.onToggleService}
          trackColor={{ false: "#ccc", true: "#333" }}
        />
      </View>
      <View style={styles.statusRow}>
        <Animated.View
          style={[
            styles.statusDot,
            { backgroundColor: properties.dotColor },
            properties.serviceStatus === "recording" && {
              opacity: properties.pulseAnimation,
            },
          ]}
        />
        <Text style={styles.statusValue}>{properties.statusLabel}</Text>
      </View>
    </View>
  )
}
