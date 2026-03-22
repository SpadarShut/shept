import { useState, useCallback } from "react"
import { router } from "expo-router"
import { useSettingsStore } from "../../stores/settings-store"
import { useOnboardingPermissions } from "./use-onboarding-permissions"
import type { OnboardingPermissions } from "./use-onboarding-permissions"
import {
  TOTAL_STEPS,
  STEP_LANGUAGES,
  STEP_NOTIFICATIONS,
  STEP_OVERLAY,
  STEP_ACCESSIBILITY,
  STEP_MICROPHONE,
  STEP_API_KEYS,
} from "./onboarding-constants"

interface CanProceedInput {
  step: number
  selectedLanguages: string[]
  permissions: OnboardingPermissions
  elevenLabsKey: string
  googleKey: string
}

function canProceed(input: CanProceedInput): boolean {
  switch (input.step) {
    case STEP_LANGUAGES: {
      return input.selectedLanguages.length > 0
    }
    case STEP_NOTIFICATIONS: {
      return input.permissions.notificationGranted
    }
    case STEP_OVERLAY: {
      return input.permissions.overlayGranted
    }
    case STEP_ACCESSIBILITY: {
      return input.permissions.accessibilityGranted
    }
    case STEP_MICROPHONE: {
      return input.permissions.microphoneGranted
    }
    case STEP_API_KEYS: {
      return (
        input.elevenLabsKey.trim().length > 0 ||
        input.googleKey.trim().length > 0
      )
    }
    default: {
      return true
    }
  }
}

export interface OnboardingState {
  step: number
  selectedLanguages: string[]
  provider: "elevenlabs" | "google"
  elevenLabsKey: string
  googleKey: string
  permissions: OnboardingPermissions
  isNextEnabled: boolean
  setProvider: (value: "elevenlabs" | "google") => void
  setElevenLabsKey: (value: string) => void
  setGoogleKey: (value: string) => void
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
    if (step < TOTAL_STEPS - 1) {
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
  const [provider, setProvider] = useState<"elevenlabs" | "google">(
    "elevenlabs",
  )
  const [elevenLabsKey, setElevenLabsKey] = useState("")
  const [googleKey, setGoogleKey] = useState("")
  const setMany = useSettingsStore((state) => state.setMany)
  const permissions = useOnboardingPermissions()
  const { handleNext, handleBack } = useStepNavigation(step, setStep)

  const handleFinish = useCallback(() => {
    setMany({
      languages: selectedLanguages,
      primaryLanguage: selectedLanguages[0] ?? "",
      sttProvider: provider,
      elevenLabsApiKey: elevenLabsKey,
      googleCloudApiKey: googleKey,
      onboardingComplete: true,
      autoStart: true,
    })
    router.replace("/")
  }, [selectedLanguages, provider, elevenLabsKey, googleKey, setMany])

  return {
    step,
    selectedLanguages,
    provider,
    elevenLabsKey,
    googleKey,
    permissions,
    isNextEnabled: canProceed({
      step,
      selectedLanguages,
      permissions,
      elevenLabsKey,
      googleKey,
    }),
    setProvider,
    setElevenLabsKey,
    setGoogleKey,
    toggleLanguage,
    handleNext,
    handleBack,
    handleFinish,
  }
}
