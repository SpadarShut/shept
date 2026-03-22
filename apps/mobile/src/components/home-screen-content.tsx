import {
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native"
import { Animated } from "react-native"
import { router } from "expo-router"
import { useTranslation } from "react-i18next"

import { homeScreenStyles as styles } from "../styles/home-screen-styles"
import { ServiceStatusCard } from "./service-status-card"
import { DemoInputSection } from "./demo-input-section"

interface StatusDisplay {
  labelKey: string
  color: string
}

function getStatusDisplay(
  serviceRunning: boolean,
  serviceStatus: string,
): StatusDisplay {
  if (!serviceRunning) {
    return { labelKey: "home.status.notRunning", color: "#999" }
  }
  switch (serviceStatus) {
    case "recording": {
      return { labelKey: "home.status.recording", color: "#D32F2F" }
    }
    case "transcribing": {
      return { labelKey: "home.status.transcribing", color: "#FF9800" }
    }
    default: {
      return { labelKey: "home.status.ready", color: "#4CAF50" }
    }
  }
}

interface HomeScreenContentProperties {
  serviceStatus: string
  lastTranscription: string
  serviceRunning: boolean
  pulseAnimation: Animated.Value
  handleToggleService: () => void
}

export function HomeScreenContent(properties: HomeScreenContentProperties) {
  const { t: tr } = useTranslation()
  const { labelKey, color: dotColor } = getStatusDisplay(
    properties.serviceRunning,
    properties.serviceStatus,
  )
  const statusLabel = tr(labelKey)

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{tr("home.title")}</Text>
        <Text style={styles.subtitle}>{tr("home.subtitle")}</Text>
        <ServiceStatusCard
          statusLabel={statusLabel}
          dotColor={dotColor}
          serviceStatus={properties.serviceStatus}
          lastTranscription={properties.lastTranscription}
          pulseAnimation={properties.pulseAnimation}
        />
        <DemoInputSection />
        {Platform.OS === "android" && (
          <TouchableOpacity
            style={[
              styles.serviceButton,
              properties.serviceRunning && styles.serviceButtonStop,
            ]}
            onPress={properties.handleToggleService}
          >
            <Text style={styles.serviceButtonText}>
              {properties.serviceRunning
                ? tr("home.stopService")
                : tr("home.startService")}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push("/settings")}
        >
          <Text style={styles.settingsButtonText}>{tr("home.settings")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
