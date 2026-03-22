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
  const { hydrated, onboardingComplete, autoStart } = options

  useEffect(() => {
    if (
      hydrated &&
      onboardingComplete &&
      autoStart &&
      Platform.OS === "android" &&
      SheptNative.isOverlayPermissionGranted()
    ) {
      startOverlayService(poll)
    }
  }, [hydrated, onboardingComplete, autoStart, poll])

  const handleToggleService = useCallback(() => {
    if (Platform.OS !== "android") {
      return
    }
    if (poll.serviceRunning) {
      stopOverlayService(poll)
      return
    }
    if (!SheptNative.isOverlayPermissionGranted()) {
      SheptNative.requestOverlayPermission()
      return
    }
    startOverlayService(poll)
  }, [poll])

  return {
    serviceStatus: poll.serviceStatus,
    lastTranscription: poll.lastTranscription,
    serviceRunning: poll.serviceRunning,
    handleToggleService,
  }
}
