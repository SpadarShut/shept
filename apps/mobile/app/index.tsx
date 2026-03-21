import { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useSettingsStore } from "../src/stores/settings-store";

export default function HomeScreen() {
  const hydrated = useSettingsStore((s) => s.hydrated);
  const onboardingComplete = useSettingsStore((s) => s.onboardingComplete);
  const hydrate = useSettingsStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (hydrated && !onboardingComplete) {
      router.replace("/onboarding");
    }
  }, [hydrated, onboardingComplete]);

  if (!hydrated || !onboardingComplete) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#333" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shept</Text>
      <Text style={styles.subtitle}>Voice to text, everywhere</Text>
      <View style={styles.statusBox}>
        <Text style={styles.statusLabel}>Service Status</Text>
        <Text style={styles.statusValue}>Not running</Text>
      </View>
      <TouchableOpacity
        style={styles.settingsBtn}
        onPress={() => router.push("/settings")}
      >
        <Text style={styles.settingsBtnText}>Settings</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 8,
  },
  statusBox: {
    marginTop: 40,
    padding: 24,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    width: "80%",
  },
  statusLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: "600",
  },
  settingsBtn: {
    marginTop: 32,
    backgroundColor: "#333",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  settingsBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
