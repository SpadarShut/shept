import {
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native"
import { Animated } from "react-native"
import { router } from "expo-router"

import { homeScreenStyles as styles } from "../styles/home-screen-styles"
import { ServiceStatusCard } from "./service-status-card"
import { DemoInputSection } from "./demo-input-section"

interface StatusDisplay {
  label: string
  color: string
}

function getStatusDisplay(
  serviceRunning: boolean,
  serviceStatus: string,
): StatusDisplay {
  if (!serviceRunning) {
    return { label: "Not running", color: "#999" }
  }
  switch (serviceStatus) {
    case "recording": {
      return { label: "Recording...", color: "#D32F2F" }
    }
    case "transcribing": {
      return { label: "Transcribing...", color: "#FF9800" }
    }
    default: {
      return { label: "Ready", color: "#4CAF50" }
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
  const { label: statusLabel, color: dotColor } = getStatusDisplay(
    properties.serviceRunning,
    properties.serviceStatus,
  )

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Shept</Text>
        <Text style={styles.subtitle}>Voice to text, everywhere</Text>
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
              {properties.serviceRunning ? "Stop Service" : "Start Service"}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push("/settings")}
        >
          <Text style={styles.settingsButtonText}>Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
