import { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  AppState,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSettingsStore } from "../src/stores/settings-store";
import SheptNative from "../modules/shept-native/src/SheptNativeModule";

export default function HomeScreen() {
  const hydrated = useSettingsStore((s) => s.hydrated);
  const onboardingComplete = useSettingsStore((s) => s.onboardingComplete);
  const hydrate = useSettingsStore((s) => s.hydrate);

  const [serviceStatus, setServiceStatus] = useState("idle");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pollStatus = useCallback(() => {
    if (Platform.OS !== "android") {
      return;
    }
    try {
      const status = SheptNative.getServiceStatus();
      setServiceStatus(status);
    } catch {}
  }, []);

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (hydrated && !onboardingComplete) {
      router.replace("/onboarding");
    }
  }, [hydrated, onboardingComplete]);

  // Poll service status
  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }
    pollStatus();
    intervalRef.current = setInterval(pollStatus, 2000);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        pollStatus();
      }
    });
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      sub.remove();
    };
  }, [pollStatus]);

  const isRunning = serviceStatus !== "idle";

  const handleToggleService = () => {
    if (Platform.OS !== "android") {
      return;
    }
    if (isRunning) {
      SheptNative.stopOverlay();
      setServiceStatus("idle");
    } else {
      SheptNative.startOverlay();
      // Poll after short delay to pick up new status
      setTimeout(pollStatus, 500);
    }
  };

  if (!hydrated || !onboardingComplete) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#333" />
      </View>
    );
  }

  const statusLabel =
    serviceStatus === "idle"
      ? "Not running"
      : serviceStatus === "recording"
        ? "Recording..."
        : serviceStatus === "transcribing"
          ? "Transcribing..."
          : serviceStatus;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shept</Text>
      <Text style={styles.subtitle}>Voice to text, everywhere</Text>
      <View style={styles.statusBox}>
        <Text style={styles.statusLabel}>Service Status</Text>
        <Text style={styles.statusValue}>{statusLabel}</Text>
      </View>
      {Platform.OS === "android" && (
        <TouchableOpacity
          style={[styles.serviceBtn, isRunning && styles.serviceBtnStop]}
          onPress={handleToggleService}
        >
          <Text style={styles.serviceBtnText}>
            {isRunning ? "Stop Service" : "Start Service"}
          </Text>
        </TouchableOpacity>
      )}
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
  serviceBtn: {
    marginTop: 24,
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  serviceBtnStop: {
    backgroundColor: "#D32F2F",
  },
  serviceBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  settingsBtn: {
    marginTop: 16,
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
