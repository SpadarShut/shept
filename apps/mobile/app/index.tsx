import { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  AppState,
  Platform,
  Animated,
} from "react-native";
import { router } from "expo-router";
import { useSettingsStore } from "../src/stores/settings-store";
import SheptNative from "../modules/shept-native/src/SheptNativeModule";

export default function HomeScreen() {
  const hydrated = useSettingsStore((s) => s.hydrated);
  const onboardingComplete = useSettingsStore((s) => s.onboardingComplete);
  const hydrate = useSettingsStore((s) => s.hydrate);

  const [serviceStatus, setServiceStatus] = useState("idle");
  const [lastTranscription, setLastTranscription] = useState("");
  const [serviceRunning, setServiceRunning] = useState(false);
  const serviceStartedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const pollStatus = useCallback(() => {
    if (Platform.OS !== "android") {
      return;
    }
    try {
      const status = SheptNative.getServiceStatus();
      setServiceStatus(status);
      // If actively recording/transcribing, service is running
      // If idle but we explicitly started it, it's still running
      if (status !== "idle") {
        setServiceRunning(true);
        serviceStartedRef.current = true;
      } else {
        setServiceRunning(serviceStartedRef.current);
      }
      const transcription = SheptNative.getLastTranscription();
      setLastTranscription(transcription);
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

  // Pulse animation for recording dot
  useEffect(() => {
    if (serviceStatus === "recording") {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [serviceStatus, pulseAnim]);

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

  const getStatusDisplay = () => {
    if (!serviceRunning) {
      return { label: "Not running", color: "#999" };
    }
    switch (serviceStatus) {
      case "recording":
        return { label: "Recording...", color: "#D32F2F" };
      case "transcribing":
        return { label: "Transcribing...", color: "#FF9800" };
      default:
        return { label: "Ready", color: "#4CAF50" };
    }
  };

  const handleToggleService = async () => {
    if (Platform.OS !== "android") {
      return;
    }
    if (serviceRunning) {
      SheptNative.stopOverlay();
      setServiceStatus("idle");
      setServiceRunning(false);
      serviceStartedRef.current = false;
    } else {
      if (!SheptNative.isOverlayPermissionGranted()) {
        SheptNative.requestOverlayPermission();
        return;
      }
      SheptNative.startOverlay();
      setServiceRunning(true);
      serviceStartedRef.current = true;
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

  const { label: statusLabel, color: dotColor } = getStatusDisplay();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shept</Text>
      <Text style={styles.subtitle}>Voice to text, everywhere</Text>
      <View style={styles.statusBox}>
        <Text style={styles.statusLabel}>Service Status</Text>
        <View style={styles.statusRow}>
          <Animated.View
            style={[
              styles.statusDot,
              { backgroundColor: dotColor },
              serviceStatus === "recording" && { opacity: pulseAnim },
            ]}
          />
          <Text style={styles.statusValue}>{statusLabel}</Text>
        </View>
        {lastTranscription !== "" && (
          <Text style={styles.transcriptionText} numberOfLines={3}>
            {lastTranscription}
          </Text>
        )}
      </View>
      {Platform.OS === "android" && (
        <TouchableOpacity
          style={[styles.serviceBtn, serviceRunning && styles.serviceBtnStop]}
          onPress={handleToggleService}
        >
          <Text style={styles.serviceBtnText}>
            {serviceRunning ? "Stop Service" : "Start Service"}
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
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: "600",
  },
  transcriptionText: {
    marginTop: 12,
    fontSize: 13,
    color: "#444",
    textAlign: "center",
    fontStyle: "italic",
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
