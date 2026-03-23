import { useCallback, useState } from "react"
import { router } from "expo-router"
import { useSettingsStore } from "../../stores/settings-store"
import type { OnboardingPermissions } from "./use-onboarding-permissions"
import { useOnboardingPermissions } from "./use-onboarding-permissions"
import { STEPS } from "./onboarding-constants"

interface CanProceedInput {
  step: number
  selectedLanguages: string[]
  permissions: OnboardingPermissions
  elevenLabsKey: string
}

function canProceed(input: CanProceedInput): boolean {
  switch (input.step) {
    case STEPS.indexOf("LANGUAGES"): {
      return input.selectedLanguages.length > 0
    }
    case STEPS.indexOf("NOTIFICATIONS"): {
      return input.permissions.notificationGranted
    }
    case STEPS.indexOf("OVERLAY"): {
      return input.permissions.overlayGranted
    }
    case STEPS.indexOf("ACCESSIBILITY"): {
      return input.permissions.accessibilityGranted
    }
    case STEPS.indexOf("MICROPHONE"): {
      return input.permissions.microphoneGranted
    }
    case STEPS.indexOf("API_KEYS"): {
      return input.elevenLabsKey.trim().length > 0
    }
    default: {
      return true
    }
  }
}

export interface OnboardingState {
  step: number
  selectedLanguages: string[]
  elevenLabsKey: string
  permissions: OnboardingPermissions
  isNextEnabled: boolean
  setElevenLabsKey: (value: string) => void
  toggleLanguage: (code: string) => void
  handleNext: () => void
  handleBack: () => void
  handleFinish: () => void
}

function useLanguageToggle() {
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const toggleLanguage = useCallback((code: string) => {
    setSelectedLanguages((previous) => {
      if (previous.includes(code)) {
        return previous.filter((current) => current !== code)
      }
      return [...previous, code]
    })
  }, [])
  return { selectedLanguages, toggleLanguage }
}

function useStepNavigation(step: number, setStep: (value: number) => void) {
  const handleNext = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    }
  }, [step, setStep])

  const handleBack = useCallback(() => {
    if (step > 0) {
      setStep(step - 1)
    }
  }, [step, setStep])

  return { handleNext, handleBack }
}

export function useOnboardingState(): OnboardingState {
  const [step, setStep] = useState(0)
  const { selectedLanguages, toggleLanguage } = useLanguageToggle()
  const [elevenLabsKey, setElevenLabsKey] = useState("")
  const setMany = useSettingsStore((state) => state.setMany)
  const permissions = useOnboardingPermissions()
  const { handleNext, handleBack } = useStepNavigation(step, setStep)

  const handleFinish = useCallback(() => {
    setMany({
      languages: selectedLanguages,
      primaryLanguage: selectedLanguages[0] ?? "",
      sttProvider: "elevenlabs",
      elevenLabsApiKey: elevenLabsKey,
      onboardingComplete: true,
      autoStart: true,
    })
    router.replace("/")
  }, [selectedLanguages, elevenLabsKey, setMany])

  return {
    step,
    selectedLanguages,
    elevenLabsKey,
    permissions,
    isNextEnabled: canProceed({
      step,
      selectedLanguages,
      permissions,
      elevenLabsKey,
    }),
    setElevenLabsKey,
    toggleLanguage,
    handleNext,
    handleBack,
    handleFinish,
  }
}
