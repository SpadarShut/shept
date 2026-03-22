import { useRef } from "react"
import { View, Text, TextInput, TouchableOpacity } from "react-native"

import { homeScreenStyles as styles } from "../styles/home-screen-styles"
import { DEMO_INPUT_LINES } from "../constants/home-screen"

export function DemoInputSection() {
  const inputReference = useRef<TextInput>(null)

  return (
    <View style={styles.demoSection}>
      <Text style={styles.demoLabel}>See in action</Text>
      <TextInput
        ref={inputReference}
        style={styles.demoInput}
        placeholder="Focus here, then tap the overlay…"
        placeholderTextColor="#aaa"
        multiline
        numberOfLines={DEMO_INPUT_LINES}
        textAlignVertical="top"
      />
      <TouchableOpacity
        style={styles.clearButton}
        onPress={() => inputReference.current?.clear()}
      >
        <Text style={styles.clearButtonText}>Clear</Text>
      </TouchableOpacity>
    </View>
  )
}
