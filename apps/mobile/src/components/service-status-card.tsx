import { View, Text, Animated, TouchableOpacity, Platform } from "react-native"
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
      <Text style={styles.statusLabel}>{tr("home.serviceStatus")}</Text>
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
      {Platform.OS === "android" && (
        <TouchableOpacity
          style={[
            styles.serviceButton,
            properties.serviceRunning && styles.serviceButtonStop,
          ]}
          onPress={properties.onToggleService}
        >
          <Text style={styles.serviceButtonText}>
            {properties.serviceRunning
              ? tr("home.stopService")
              : tr("home.startService")}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}
