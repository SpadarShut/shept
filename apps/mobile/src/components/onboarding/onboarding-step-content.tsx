import type { OnboardingPermissions } from "./use-onboarding-permissions"
import {
  STEP_LANGUAGES,
  STEP_NOTIFICATIONS,
  STEP_OVERLAY,
  STEP_ACCESSIBILITY,
  STEP_MICROPHONE,
  STEP_API_KEYS,
  STEP_FINISH,
} from "./onboarding-constants"
import {
  WelcomeStep,
  LanguageStep,
  PermissionStep,
  AccessibilityStep,
  FinishStep,
} from "./onboarding-steps"
import { ApiKeyStep } from "./api-key-step"

export interface OnboardingStepContentProperties {
  step: number
  selectedLanguages: string[]
  toggleLanguage: (code: string) => void
  permissions: OnboardingPermissions
  provider: "elevenlabs" | "google"
  setProvider: (value: "elevenlabs" | "google") => void
  elevenLabsKey: string
  setElevenLabsKey: (value: string) => void
  googleKey: string
  setGoogleKey: (value: string) => void
  onFinish: () => void
}

function renderPermissionStep(
  step: number,
  permissions: OnboardingPermissions,
): React.JSX.Element | undefined {
  switch (step) {
    case STEP_NOTIFICATIONS: {
      return (
        <PermissionStep
          title="Notification Permission"
          description="Required to keep the voice service running."
          buttonLabel="Allow Notifications"
          granted={permissions.notificationGranted}
          onPress={permissions.requestNotification}
        />
      )
    }
    case STEP_OVERLAY: {
      return (
        <PermissionStep
          title="Overlay Permission"
          description="Allows the mic button to float over other apps."
          buttonLabel="Allow Overlay"
          granted={permissions.overlayGranted}
          onPress={permissions.requestOverlay}
        />
      )
    }
    case STEP_MICROPHONE: {
      return (
        <PermissionStep
          title="Microphone Permission"
          description="Required to capture your voice for transcription."
          buttonLabel="Allow Microphone"
          granted={permissions.microphoneGranted}
          onPress={permissions.requestMicrophone}
        />
      )
    }
    default: {
      return undefined
    }
  }
}

export function OnboardingStepContent(
  properties: OnboardingStepContentProperties,
): React.JSX.Element | undefined {
  const permissionStep = renderPermissionStep(
    properties.step,
    properties.permissions,
  )
  if (permissionStep) {
    return permissionStep
  }

  switch (properties.step) {
    case STEP_LANGUAGES: {
      return (
        <LanguageStep
          selectedLanguages={properties.selectedLanguages}
          toggleLanguage={properties.toggleLanguage}
        />
      )
    }
    case STEP_ACCESSIBILITY: {
      return (
        <AccessibilityStep
          accessibilityGranted={properties.permissions.accessibilityGranted}
          openAccessibility={properties.permissions.openAccessibility}
        />
      )
    }
    case STEP_API_KEYS: {
      return (
        <ApiKeyStep
          provider={properties.provider}
          setProvider={properties.setProvider}
          elevenLabsKey={properties.elevenLabsKey}
          setElevenLabsKey={properties.setElevenLabsKey}
          googleKey={properties.googleKey}
          setGoogleKey={properties.setGoogleKey}
        />
      )
    }
    case STEP_FINISH: {
      return <FinishStep onFinish={properties.onFinish} />
    }
    default: {
      return <WelcomeStep />
    }
  }
}
