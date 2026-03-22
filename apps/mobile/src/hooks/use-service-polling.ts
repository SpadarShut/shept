import { useEffect, useRef, useState, useCallback } from "react"
import { AppState, Platform } from "react-native"

import SheptNative from "../../modules/shept-native/src/shept-native-module"
import { AUTO_START_DELAY_MS, POLL_INTERVAL_MS } from "../constants/home-screen"

interface ServicePollingOptions {
  hydrated: boolean
  onboardingComplete: boolean
  autoStart: boolean
  allPassed: boolean
}

interface ServicePollingResult {
  serviceStatus: string
  lastTranscription: string
  serviceRunning: boolean
  handleToggleService: () => void
}

interface ServiceState {
  setServiceStatus: (status: string) => void
  setServiceRunning: (running: boolean) => void
  serviceStartedReference: React.MutableRefObject<boolean>
  pollStatus: () => void
}

function startOverlay(state: ServiceState): void {
  SheptNative.startOverlay()
  state.setServiceRunning(true)
  state.serviceStartedReference.current = true
  setTimeout(state.pollStatus, AUTO_START_DELAY_MS)
}

function stopOverlay(state: ServiceState): void {
  SheptNative.stopOverlay()
  state.setServiceStatus("idle")
  state.setServiceRunning(false)
  state.serviceStartedReference.current = false
}

interface PollerSetters {
  serviceStartedReference: React.MutableRefObject<boolean>
  setServiceStatus: (s: string) => void
  setServiceRunning: (r: boolean) => void
  setLastTranscription: (t: string) => void
}

function useStatusPoller(setters: PollerSetters) {
  const intervalReference = useRef<ReturnType<typeof setInterval> | null>(null)

  const pollStatus = useCallback(() => {
    if (Platform.OS !== "android") return
    try {
      const status = SheptNative.getServiceStatus()
      setters.setServiceStatus(status)
      if (status === "idle") {
        setters.setServiceRunning(setters.serviceStartedReference.current)
      } else {
        setters.setServiceRunning(true)
        setters.serviceStartedReference.current = true
      }
      setters.setLastTranscription(SheptNative.getLastTranscription())
    } catch {}
  }, [setters])

  useEffect(() => {
    if (Platform.OS !== "android") return () => {}
    pollStatus()
    intervalReference.current = setInterval(pollStatus, POLL_INTERVAL_MS)
    const subscription = AppState.addEventListener("change", (appState) => {
      if (appState === "active") pollStatus()
    })
    return () => {
      if (intervalReference.current) clearInterval(intervalReference.current)
      subscription.remove()
    }
  }, [pollStatus])

  return pollStatus
}

export function useServicePolling(
  options: ServicePollingOptions,
): ServicePollingResult {
  const { hydrated, onboardingComplete, autoStart, allPassed } = options

  const [serviceStatus, setServiceStatus] = useState("idle")
  const [lastTranscription, setLastTranscription] = useState("")
  const [serviceRunning, setServiceRunning] = useState(false)
  const serviceStartedReference = useRef(false)

  const pollStatus = useStatusPoller({
    serviceStartedReference,
    setServiceStatus,
    setServiceRunning,
    setLastTranscription,
  })

  const state: ServiceState = {
    setServiceStatus,
    setServiceRunning,
    serviceStartedReference,
    pollStatus,
  }

  useEffect(() => {
    if (
      hydrated &&
      onboardingComplete &&
      autoStart &&
      allPassed &&
      Platform.OS === "android" &&
      !serviceStartedReference.current
    ) {
      startOverlay(state)
    }
  }, [hydrated, onboardingComplete, autoStart, allPassed, state])

  useEffect(() => {
    if (!allPassed && serviceStartedReference.current) stopOverlay(state)
  }, [allPassed, state])

  const handleToggleService = useCallback(() => {
    if (Platform.OS !== "android") return
    if (serviceRunning) {
      stopOverlay(state)
      return
    }
    if (!allPassed) return
    startOverlay(state)
  }, [serviceRunning, allPassed, state])

  return {
    serviceStatus,
    lastTranscription,
    serviceRunning,
    handleToggleService,
  }
}
