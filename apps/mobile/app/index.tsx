import { useEffect } from "react"
import { View, ActivityIndicator } from "react-native"
import { router } from "expo-router"

import { useSettingsStore } from "../src/stores/settings-store"
import { useServicePolling } from "../src/hooks/use-service-polling"
import { usePulseAnimation } from "../src/hooks/use-pulse-animation"
import { homeScreenStyles as styles } from "../src/styles/home-screen-styles"
import { HomeScreenContent } from "../src/components/home-screen-content"

export default function HomeScreen() {
  const hydrated = useSettingsStore((state) => state.hydrated)
  const onboardingComplete = useSettingsStore(
    (state) => state.onboardingComplete,
  )
  const autoStart = useSettingsStore((state) => state.autoStart)
  const hydrate = useSettingsStore((state) => state.hydrate)

  const {
    serviceStatus,
    lastTranscription,
    serviceRunning,
    handleToggleService,
  } = useServicePolling({ hydrated, onboardingComplete, autoStart })

  const pulseAnimation = usePulseAnimation(serviceStatus)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    if (hydrated && !onboardingComplete) {
      router.replace("/onboarding")
    }
  }, [hydrated, onboardingComplete])

  if (!hydrated || !onboardingComplete) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#333" />
      </View>
    )
  }

  return (
    <HomeScreenContent
      serviceStatus={serviceStatus}
      lastTranscription={lastTranscription}
      serviceRunning={serviceRunning}
      pulseAnimation={pulseAnimation}
      handleToggleService={handleToggleService}
    />
  )
}
