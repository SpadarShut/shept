import { useState } from "react"
import { View, Text, TouchableOpacity, TextInput, FlatList } from "react-native"
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
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepDesc}>{description}</Text>
      {granted ? (
        <Text style={styles.grantedText}>Granted</Text>
      ) : (
        <TouchableOpacity style={styles.permBtn} onPress={onPress}>
          <Text style={styles.permBtnText}>{buttonLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

export function WelcomeStep(): React.JSX.Element {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.logo}>Shept</Text>
      <Text style={styles.stepTitle}>Voice to text, everywhere</Text>
      <Text style={styles.stepDesc}>
        Shept transcribes your speech and injects it into any text field.
      </Text>
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
  const [languageSearch, setLanguageSearch] = useState("")

  const filteredLanguages = LANGUAGES.filter((language) =>
    language.name.toLowerCase().includes(languageSearch.toLowerCase()),
  )

  return (
    <View style={[styles.stepContent, styles.flex1]}>
      <Text style={styles.stepTitle}>Select Languages</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Search languages..."
        placeholderTextColor="#999"
        value={languageSearch}
        onChangeText={setLanguageSearch}
      />
      {selectedLanguages.length > 0 && (
        <SelectedLanguageChips
          selectedLanguages={selectedLanguages}
          toggleLanguage={toggleLanguage}
        />
      )}
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

interface SelectedLanguageChipsProperties {
  selectedLanguages: string[]
  toggleLanguage: (code: string) => void
}

function SelectedLanguageChips({
  selectedLanguages,
  toggleLanguage,
}: SelectedLanguageChipsProperties): React.JSX.Element {
  return (
    <View style={styles.chipsRow}>
      {selectedLanguages.map((code) => {
        const language = LANGUAGES.find((candidate) => candidate.code === code)
        return (
          <TouchableOpacity
            key={code}
            style={styles.chip}
            onPress={() => toggleLanguage(code)}
          >
            <Text style={styles.chipText}>{language?.name ?? code} x</Text>
          </TouchableOpacity>
        )
      })}
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
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Accessibility Service</Text>
      <Text style={styles.stepDesc}>
        Detects text fields and injects transcribed text.
      </Text>
      {accessibilityGranted ? (
        <Text style={styles.grantedText}>Enabled</Text>
      ) : (
        <>
          <Text style={styles.stepHint}>
            Scroll to find Shept and enable it.
          </Text>
          <TouchableOpacity style={styles.permBtn} onPress={openAccessibility}>
            <Text style={styles.permBtnText}>Open Accessibility Settings</Text>
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
  return (
    <View style={styles.stepContent}>
      <Text style={styles.logo}>Shept</Text>
      <Text style={styles.stepTitle}>You&apos;re all set!</Text>
      <Text style={styles.stepDesc}>
        Shept is ready to transcribe your voice.
      </Text>
      <TouchableOpacity style={styles.startBtn} onPress={onFinish}>
        <Text style={styles.startBtnText}>Start Shept</Text>
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
