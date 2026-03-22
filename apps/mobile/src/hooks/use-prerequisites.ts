import { useState, useEffect, useCallback, useRef } from "react"
import { Platform, PermissionsAndroid, AppState } from "react-native"

import SheptNative from "../../modules/shept-native/src/shept-native-module"

export type PrerequisiteStatus = {
  overlay: boolean
  accessibility: boolean
  microphone: boolean
  notification: boolean
  apiKey: boolean
}

type PrerequisiteInput = {
  elevenLabsApiKey: string
  googleCloudApiKey: string
  sttProvider: "elevenlabs" | "google"
}

const ALL_GRANTED: PrerequisiteStatus = {
  overlay: true,
  accessibility: true,
  microphone: true,
  notification: true,
  apiKey: true,
}

const DEBOUNCE_MS = 300

async function checkAndroidPermissions(
  input: PrerequisiteInput,
): Promise<PrerequisiteStatus> {
  const overlay = SheptNative.isOverlayPermissionGranted()
  const accessibility = SheptNative.isAccessibilityEnabled()
  const notification = SheptNative.isNotificationPermissionGranted()

  let microphone = false
  try {
    microphone = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    )
  } catch {}

  const apiKey =
    input.sttProvider === "elevenlabs"
      ? input.elevenLabsApiKey.length > 0
      : input.googleCloudApiKey.length > 0

  return { overlay, accessibility, microphone, notification, apiKey }
}

export function usePrerequisites(input: PrerequisiteInput) {
  const [status, setStatus] = useState<PrerequisiteStatus>({
    overlay: false,
    accessibility: false,
    microphone: false,
    notification: false,
    apiKey: false,
  })

  const debounceReference = useRef<ReturnType<typeof setTimeout> | null>(null)

  const check = useCallback(async () => {
    if (Platform.OS !== "android") {
      setStatus(ALL_GRANTED)
      return
    }
    setStatus(await checkAndroidPermissions(input))
  }, [input.elevenLabsApiKey, input.googleCloudApiKey, input.sttProvider])

  useEffect(() => {
    check()
  }, [check])

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        if (debounceReference.current) clearTimeout(debounceReference.current)
        debounceReference.current = setTimeout(check, DEBOUNCE_MS)
      }
    })
    return () => {
      sub.remove()
      if (debounceReference.current) clearTimeout(debounceReference.current)
    }
  }, [check])

  const allPassed = Object.values(status).every(Boolean)

  return { status, allPassed, recheck: check }
}
