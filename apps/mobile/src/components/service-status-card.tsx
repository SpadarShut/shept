import { View, Text, Animated } from "react-native"

import { homeScreenStyles as styles } from "../styles/home-screen-styles"
import { TRANSCRIPTION_MAX_LINES } from "../constants/home-screen"

interface ServiceStatusCardProperties {
  statusLabel: string
  dotColor: string
  serviceStatus: string
  lastTranscription: string
  pulseAnimation: Animated.Value
}

export function ServiceStatusCard(properties: ServiceStatusCardProperties) {
  return (
    <View style={styles.statusBox}>
      <Text style={styles.statusLabel}>Service Status</Text>
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
      {properties.lastTranscription !== "" && (
        <Text
          style={styles.transcriptionText}
          numberOfLines={TRANSCRIPTION_MAX_LINES}
        >
          {properties.lastTranscription}
        </Text>
      )}
    </View>
  )
}
