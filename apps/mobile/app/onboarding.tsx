import { View, TouchableOpacity, Text } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { onboardingStyles as styles } from "../src/components/onboarding/onboarding-styles"
import {
  TOTAL_STEPS,
  STEP_FINISH,
  BACK_BUTTON_WIDTH,
} from "../src/components/onboarding/onboarding-constants"
import { StepDots } from "../src/components/onboarding/onboarding-steps"
import { OnboardingStepContent } from "../src/components/onboarding/onboarding-step-content"
import { useOnboardingState } from "../src/components/onboarding/use-onboarding-state"

export default function OnboardingScreen(): React.JSX.Element {
  const state = useOnboardingState()

  return (
    <SafeAreaView style={styles.container}>
      <StepDots current={state.step} total={TOTAL_STEPS} />
      <View style={styles.flex1}>
        <OnboardingStepContent
          step={state.step}
          selectedLanguages={state.selectedLanguages}
          toggleLanguage={state.toggleLanguage}
          permissions={state.permissions}
          provider={state.provider}
          setProvider={state.setProvider}
          elevenLabsKey={state.elevenLabsKey}
          setElevenLabsKey={state.setElevenLabsKey}
          googleKey={state.googleKey}
          setGoogleKey={state.setGoogleKey}
          onFinish={state.handleFinish}
        />
      </View>
      {state.step < STEP_FINISH && (
        <NavigationRow
          step={state.step}
          isNextEnabled={state.isNextEnabled}
          onNext={state.handleNext}
          onBack={state.handleBack}
        />
      )}
    </SafeAreaView>
  )
}

interface NavigationRowProperties {
  step: number
  isNextEnabled: boolean
  onNext: () => void
  onBack: () => void
}

function NavigationRow({
  step,
  isNextEnabled,
  onNext,
  onBack,
}: NavigationRowProperties): React.JSX.Element {
  const { t: tr } = useTranslation()
  return (
    <View style={styles.navRow}>
      {step > 0 ? (
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>{tr("onboarding.back")}</Text>
        </TouchableOpacity>
      ) : (
        <View style={{ width: BACK_BUTTON_WIDTH }} />
      )}
      <TouchableOpacity
        style={[styles.nextBtn, !isNextEnabled && styles.nextBtnDisabled]}
        onPress={onNext}
        disabled={!isNextEnabled}
      >
        <Text style={styles.nextBtnText}>{tr("onboarding.next")}</Text>
      </TouchableOpacity>
    </View>
  )
}
