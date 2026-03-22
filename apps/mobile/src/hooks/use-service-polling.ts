import { useEffect, useCallback } from "react"
import { Platform } from "react-native"

import SheptNative from "../../modules/shept-native/src/shept-native-module"
import { AUTO_START_DELAY_MS } from "../constants/home-screen"
import {
  useServiceStatusPoll,
  type ServiceStatusPollResult,
} from "./use-service-status-poll"

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

function startOverlayService(poll: ServiceStatusPollResult): void {
  SheptNative.startOverlay()
  poll.setServiceRunning(true)
  poll.serviceStartedReference.current = true
  setTimeout(poll.pollStatus, AUTO_START_DELAY_MS)
}

function stopOverlayService(poll: ServiceStatusPollResult): void {
  SheptNative.stopOverlay()
  poll.setServiceStatus("idle")
  poll.setServiceRunning(false)
  poll.serviceStartedReference.current = false
}

export function useServicePolling(
  options: ServicePollingOptions,
): ServicePollingResult {
  const poll = useServiceStatusPoll()
  const { hydrated, onboardingComplete, autoStart, allPassed } = options

  useEffect(() => {
    if (
      hydrated &&
      onboardingComplete &&
      autoStart &&
      allPassed &&
      Platform.OS === "android"
    ) {
      startOverlayService(poll)
    }
  }, [hydrated, onboardingComplete, autoStart, allPassed, poll])

  useEffect(() => {
    if (!allPassed && poll.serviceRunning) {
      stopOverlayService(poll)
    }
  }, [allPassed, poll])

  const handleToggleService = useCallback(() => {
    if (Platform.OS !== "android") {
      return
    }
    if (poll.serviceRunning) {
      stopOverlayService(poll)
      return
    }
    if (!allPassed) {
      return
    }
    startOverlayService(poll)
  }, [poll, allPassed])

  return {
    serviceStatus: poll.serviceStatus,
    lastTranscription: poll.lastTranscription,
    serviceRunning: poll.serviceRunning,
    handleToggleService,
  }
}
