import { useEffect, useRef, useState, useCallback } from "react"
import { AppState, Platform } from "react-native"

import SheptNative from "../../modules/shept-native/src/shept-native-module"
import { POLL_INTERVAL_MS } from "../constants/home-screen"

export interface ServiceStatusPollResult {
  serviceStatus: string
  lastTranscription: string
  serviceRunning: boolean
  serviceStartedReference: React.MutableRefObject<boolean>
  setServiceStatus: (status: string) => void
  setServiceRunning: (running: boolean) => void
  pollStatus: () => void
}

export function useServiceStatusPoll(): ServiceStatusPollResult {
  const [serviceStatus, setServiceStatus] = useState("idle")
  const [lastTranscription, setLastTranscription] = useState("")
  const [serviceRunning, setServiceRunning] = useState(false)
  const serviceStartedReference = useRef(false)
  const intervalReference = useRef<ReturnType<typeof setInterval> | null>(null)

  const pollStatus = useCallback(() => {
    if (Platform.OS !== "android") {
      return
    }
    try {
      const status = SheptNative.getServiceStatus()
      setServiceStatus(status)
      if (status === "idle") {
        setServiceRunning(serviceStartedReference.current)
      } else {
        setServiceRunning(true)
        serviceStartedReference.current = true
      }
      setLastTranscription(SheptNative.getLastTranscription())
    } catch {}
  }, [])

  useEffect(() => {
    if (Platform.OS !== "android") {
      return () => {}
    }
    pollStatus()
    intervalReference.current = setInterval(pollStatus, POLL_INTERVAL_MS)
    const subscription = AppState.addEventListener("change", (appState) => {
      if (appState === "active") {
        pollStatus()
      }
    })
    return () => {
      if (intervalReference.current) {
        clearInterval(intervalReference.current)
      }
      subscription.remove()
    }
  }, [pollStatus])

  return {
    serviceStatus,
    lastTranscription,
    serviceRunning,
    serviceStartedReference,
    setServiceStatus,
    setServiceRunning,
    pollStatus,
  }
}
