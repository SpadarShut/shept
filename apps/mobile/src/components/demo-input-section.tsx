import { useRef } from "react"
import { View, Text, TextInput, TouchableOpacity } from "react-native"
import { useTranslation } from "react-i18next"

import { homeScreenStyles as styles } from "../styles/home-screen-styles"
import { DEMO_INPUT_LINES } from "../constants/home-screen"

export function DemoInputSection() {
  const { t: tr } = useTranslation()
  const inputReference = useRef<TextInput>(null)

  return (
    <View style={styles.demoSection}>
      <Text style={styles.demoLabel}>{tr("home.seeInAction")}</Text>
      <TextInput
        ref={inputReference}
        style={styles.demoInput}
        placeholder={tr("home.demoPlaceholder")}
        placeholderTextColor="#aaa"
        multiline
        numberOfLines={DEMO_INPUT_LINES}
        textAlignVertical="top"
      />
      <TouchableOpacity
        style={styles.clearButton}
        onPress={() => inputReference.current?.clear()}
      >
        <Text style={styles.clearButtonText}>{tr("home.clear")}</Text>
      </TouchableOpacity>
    </View>
  )
}
