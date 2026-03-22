import { requireNativeModule } from "expo"

interface SheptNativeModuleType {
  isOverlayPermissionGranted(): boolean
  requestOverlayPermission(): void
  isAccessibilityEnabled(): boolean
  openAccessibilitySettings(): void
  isNotificationPermissionGranted(): boolean
  saveSettings(json: string): void
  getSettings(): string | null
  startOverlay(): void
  stopOverlay(): void
  getServiceStatus(): string
  getLastTranscription(): string
}

export default requireNativeModule<SheptNativeModuleType>("SheptNative")
