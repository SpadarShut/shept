import { useState } from "react"
import { View, Text, TouchableOpacity, TextInput, FlatList } from "react-native"
import { useTranslation } from "react-i18next"
import { LANGUAGES } from "../../constants/languages"
import { onboardingStyles as styles } from "./onboarding-styles"

interface PermissionStepProperties {
  title: string
  description: string
  buttonLabel: string
  granted: boolean
  onPress: () => void
}

export function PermissionStep({
  title,
  description,
  buttonLabel,
  granted,
  onPress,
}: PermissionStepProperties): React.JSX.Element {
  const { t: tr } = useTranslation()
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepDesc}>{description}</Text>
      {granted ? (
        <Text style={styles.grantedText}>{tr("onboarding.granted")}</Text>
      ) : (
        <TouchableOpacity style={styles.permBtn} onPress={onPress}>
          <Text style={styles.permBtnText}>{buttonLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

export function WelcomeStep(): React.JSX.Element {
  const { t: tr } = useTranslation()
  return (
    <View style={styles.stepContent}>
      <Text style={styles.logo}>Shept</Text>
      <Text style={styles.stepTitle}>{tr("onboarding.welcome.title")}</Text>
      <Text style={styles.stepDesc}>{tr("onboarding.welcome.desc")}</Text>
    </View>
  )
}

interface LanguageStepProperties {
  selectedLanguages: string[]
  toggleLanguage: (code: string) => void
}

export function LanguageStep({
  selectedLanguages,
  toggleLanguage,
}: LanguageStepProperties): React.JSX.Element {
  const { t: tr } = useTranslation()
  const [languageSearch, setLanguageSearch] = useState("")

  const filteredLanguages = LANGUAGES.filter((language) =>
    language.name.toLowerCase().includes(languageSearch.toLowerCase()),
  )

  return (
    <View style={[styles.stepContent, styles.flex1]}>
      <Text style={styles.stepTitle}>{tr("onboarding.selectLanguages")}</Text>
      <TextInput
        style={styles.searchInput}
        placeholder={tr("onboarding.searchLanguages")}
        placeholderTextColor="#999"
        value={languageSearch}
        onChangeText={setLanguageSearch}
      />
      <FlatList
        data={filteredLanguages}
        keyExtractor={(item) => item.code}
        style={styles.flex1}
        renderItem={({ item }) => {
          const selected = selectedLanguages.includes(item.code)
          return (
            <TouchableOpacity
              style={[styles.langRow, selected && styles.langRowSelected]}
              onPress={() => toggleLanguage(item.code)}
            >
              <Text
                style={[styles.langText, selected && styles.langTextSelected]}
              >
                {item.name}
              </Text>
              {selected && <Text style={styles.checkMark}>✓</Text>}
            </TouchableOpacity>
          )
        }}
      />
    </View>
  )
}

interface AccessibilityStepProperties {
  accessibilityGranted: boolean
  openAccessibility: () => void
}

export function AccessibilityStep({
  accessibilityGranted,
  openAccessibility,
}: AccessibilityStepProperties): React.JSX.Element {
  const { t: tr } = useTranslation()
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>
        {tr("onboarding.accessibility.title")}
      </Text>
      <Text style={styles.stepDesc}>{tr("onboarding.accessibility.desc")}</Text>
      {accessibilityGranted ? (
        <Text style={styles.grantedText}>{tr("onboarding.enabled")}</Text>
      ) : (
        <>
          <Text style={styles.stepHint}>
            {tr("onboarding.accessibility.hint")}
          </Text>
          <TouchableOpacity style={styles.permBtn} onPress={openAccessibility}>
            <Text style={styles.permBtnText}>
              {tr("onboarding.accessibility.button")}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  )
}

interface FinishStepProperties {
  onFinish: () => void
}

export function FinishStep({
  onFinish,
}: FinishStepProperties): React.JSX.Element {
  const { t: tr } = useTranslation()
  return (
    <View style={styles.stepContent}>
      <Text style={styles.logo}>Shept</Text>
      <Text style={styles.stepTitle}>{tr("onboarding.finish.title")}</Text>
      <Text style={styles.stepDesc}>{tr("onboarding.finish.desc")}</Text>
      <TouchableOpacity style={styles.startBtn} onPress={onFinish}>
        <Text style={styles.startBtnText}>
          {tr("onboarding.finish.button")}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

interface StepDotsProperties {
  current: number
  total: number
}

export function StepDots({
  current,
  total,
}: StepDotsProperties): React.JSX.Element {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }, (_unused, index) => (
        <View
          key={index}
          style={[styles.dot, index === current && styles.dotActive]}
        />
      ))}
    </View>
  )
}
