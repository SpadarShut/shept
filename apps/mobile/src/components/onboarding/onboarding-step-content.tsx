import { useTranslation } from "react-i18next"
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

type Translate = (key: string) => string

interface PermissionStepArguments {
  step: number
  permissions: OnboardingPermissions
  translate: Translate
}

function renderPermissionStep({
  step,
  permissions,
  translate,
}: PermissionStepArguments): React.JSX.Element | undefined {
  switch (step) {
    case STEP_NOTIFICATIONS: {
      return (
        <PermissionStep
          title={translate("onboarding.notifications.title")}
          description={translate("onboarding.notifications.desc")}
          buttonLabel={translate("onboarding.notifications.button")}
          granted={permissions.notificationGranted}
          onPress={permissions.requestNotification}
        />
      )
    }
    case STEP_OVERLAY: {
      return (
        <PermissionStep
          title={translate("onboarding.overlay.title")}
          description={translate("onboarding.overlay.desc")}
          buttonLabel={translate("onboarding.overlay.button")}
          granted={permissions.overlayGranted}
          onPress={permissions.requestOverlay}
        />
      )
    }
    case STEP_MICROPHONE: {
      return (
        <PermissionStep
          title={translate("onboarding.microphone.title")}
          description={translate("onboarding.microphone.desc")}
          buttonLabel={translate("onboarding.microphone.button")}
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
  const { t: tr } = useTranslation()

  const permissionStep = renderPermissionStep({
    step: properties.step,
    permissions: properties.permissions,
    translate: tr,
  })
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
