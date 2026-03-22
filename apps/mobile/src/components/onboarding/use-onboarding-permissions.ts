import { useState, useCallback, useEffect } from "react"
import { AppState, Platform, PermissionsAndroid } from "react-native"
import SheptNative from "../../../modules/shept-native"
import { ANDROID_NOTIFICATION_VERSION } from "./onboarding-constants"

function useAppStateResume(callback: () => void): void {
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        callback()
      }
    })
    return () => {
      subscription.remove()
    }
  }, [callback])
}

function requestOverlayPermission(): void {
  if (Platform.OS !== "android") {
    return
  }
  SheptNative.requestOverlayPermission()
}

function openAccessibilitySettings(): void {
  if (Platform.OS !== "android") {
    return
  }
  SheptNative.openAccessibilitySettings()
}

function recheckAllPermissions(setters: PermissionSetters): void {
  if (Platform.OS !== "android") {
    return
  }
  try {
    setters.setNotification(SheptNative.isNotificationPermissionGranted())
  } catch {}
  try {
    setters.setOverlay(SheptNative.isOverlayPermissionGranted())
  } catch {}
  try {
    setters.setAccessibility(SheptNative.isAccessibilityEnabled())
  } catch {}
  PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO)
    .then(setters.setMicrophone)
    .catch(() => {})
}

interface PermissionSetters {
  setNotification: (value: boolean) => void
  setOverlay: (value: boolean) => void
  setAccessibility: (value: boolean) => void
  setMicrophone: (value: boolean) => void
}

async function doRequestNotification(
  setGranted: (value: boolean) => void,
): Promise<void> {
  if (Platform.OS !== "android") {
    return
  }
  if (Platform.Version >= ANDROID_NOTIFICATION_VERSION) {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    )
    setGranted(result === PermissionsAndroid.RESULTS.GRANTED)
  } else {
    setGranted(true)
  }
}

async function doRequestMicrophone(
  setGranted: (value: boolean) => void,
): Promise<void> {
  if (Platform.OS !== "android") {
    return
  }
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
  )
  setGranted(result === PermissionsAndroid.RESULTS.GRANTED)
}

export interface OnboardingPermissions {
  notificationGranted: boolean
  overlayGranted: boolean
  accessibilityGranted: boolean
  microphoneGranted: boolean
  requestNotification: () => Promise<void>
  requestOverlay: () => void
  openAccessibility: () => void
  requestMicrophone: () => Promise<void>
}

export function useOnboardingPermissions(): OnboardingPermissions {
  const [notificationGranted, setNotificationGranted] = useState(false)
  const [overlayGranted, setOverlayGranted] = useState(false)
  const [accessibilityGranted, setAccessibilityGranted] = useState(false)
  const [microphoneGranted, setMicrophoneGranted] = useState(false)

  const setters: PermissionSetters = {
    setNotification: setNotificationGranted,
    setOverlay: setOverlayGranted,
    setAccessibility: setAccessibilityGranted,
    setMicrophone: setMicrophoneGranted,
  }

  const recheck = useCallback(() => {
    recheckAllPermissions(setters)
  }, [])

  useEffect(() => {
    recheck()
  }, [recheck])
  useAppStateResume(recheck)

  const requestNotification = useCallback(
    () => doRequestNotification(setNotificationGranted),
    [],
  )

  const requestMicrophone = useCallback(
    () => doRequestMicrophone(setMicrophoneGranted),
    [],
  )

  return {
    notificationGranted,
    overlayGranted,
    accessibilityGranted,
    microphoneGranted,
    requestNotification,
    requestOverlay: requestOverlayPermission,
    openAccessibility: openAccessibilitySettings,
    requestMicrophone,
  }
}
