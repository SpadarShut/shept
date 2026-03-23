import { useEffect } from "react"
import { View, ActivityIndicator } from "react-native"
import { router } from "expo-router"

import { useSettingsStore } from "../src/stores/settings-store"
import { useServicePolling } from "../src/hooks/use-service-polling"
import { usePrerequisites } from "../src/hooks/use-prerequisites"
import { usePulseAnimation } from "../src/hooks/use-pulse-animation"
import { homeScreenStyles as styles } from "../src/styles/home-screen-styles"
import { HomeScreenContent } from "../src/components/home-screen-content"

export default function HomeScreen() {
  const hydrated = useSettingsStore((state) => state.hydrated)
  const onboardingComplete = useSettingsStore(
    (state) => state.onboardingComplete,
  )
  const autoStart = useSettingsStore((state) => state.autoStart)
  const elevenLabsApiKey = useSettingsStore((state) => state.elevenLabsApiKey)
  const googleCloudApiKey = useSettingsStore((state) => state.googleCloudApiKey)
  const sttProvider = useSettingsStore((state) => state.sttProvider)
  const hydrate = useSettingsStore((state) => state.hydrate)

  const {
    status: prereqStatus,
    allPassed,
    recheck,
  } = usePrerequisites({
    elevenLabsApiKey,
    googleCloudApiKey,
    sttProvider,
  })

  const { serviceStatus, serviceRunning, handleToggleService } =
    useServicePolling({ hydrated, onboardingComplete, autoStart, allPassed })

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
      serviceRunning={serviceRunning}
      pulseAnimation={pulseAnimation}
      handleToggleService={handleToggleService}
      prereqStatus={prereqStatus}
      allPassed={allPassed}
      onActionComplete={recheck}
    />
  )
}
