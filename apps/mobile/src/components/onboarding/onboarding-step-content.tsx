import { useTranslation } from "react-i18next"
import type { OnboardingPermissions } from "./use-onboarding-permissions"
import { STEPS } from "./onboarding-constants"
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
    case STEPS.indexOf("NOTIFICATIONS"): {
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
    case STEPS.indexOf("OVERLAY"): {
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
    case STEPS.indexOf("MICROPHONE"): {
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
    case STEPS.indexOf("LANGUAGES"): {
      return (
        <LanguageStep
          selectedLanguages={properties.selectedLanguages}
          toggleLanguage={properties.toggleLanguage}
        />
      )
    }
    case STEPS.indexOf("ACCESSIBILITY"): {
      return (
        <AccessibilityStep
          accessibilityGranted={properties.permissions.accessibilityGranted}
          openAccessibility={properties.permissions.openAccessibility}
        />
      )
    }
    case STEPS.indexOf("API_KEYS"): {
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
    case STEPS.indexOf("FINISH"): {
      return <FinishStep onFinish={properties.onFinish} />
    }
    default: {
      return <WelcomeStep />
    }
  }
}
