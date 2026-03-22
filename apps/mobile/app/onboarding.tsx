import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
  Linking,
  KeyboardAvoidingView,
  Platform,
  AppState,
  PermissionsAndroid,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useSettingsStore } from "../src/stores/settings-store";
import { LANGUAGES } from "../src/constants/languages";
import SheptNative from "../modules/shept-native";

const TOTAL_STEPS = 8;

function useAppStateResume(callback: () => void) {
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        callback();
      }
    });
    return () => { sub.remove(); };
  }, [callback]);
}

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[styles.dot, i === current && styles.dotActive]}
        />
      ))}
    </View>
  );
}

function PermissionStep({
  title,
  description,
  buttonLabel,
  granted,
  onPress,
}: {
  title: string;
  description: string;
  buttonLabel: string;
  granted: boolean;
  onPress: () => void;
}) {
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
  );
}

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
  const [langSearch, setLangSearch] = useState("");
  const [provider, setProvider] = useState<"elevenlabs" | "google">("elevenlabs");
  const [elevenLabsKey, setElevenLabsKey] = useState("");
  const [googleKey, setGoogleKey] = useState("");
  const setMany = useSettingsStore((s) => s.setMany);

  // Permission states
  const [notifGranted, setNotifGranted] = useState(false);
  const [overlayGranted, setOverlayGranted] = useState(false);
  const [a11yGranted, setA11yGranted] = useState(false);
  const [micGranted, setMicGranted] = useState(false);

  const recheckPermissions = useCallback(() => {
    if (Platform.OS !== "android") {
      return;
    }
    try { setNotifGranted(SheptNative.isNotificationPermissionGranted()); } catch {}
    try { setOverlayGranted(SheptNative.isOverlayPermissionGranted()); } catch {}
    try { setA11yGranted(SheptNative.isAccessibilityEnabled()); } catch {}
    PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO)
      .then(setMicGranted)
      .catch(() => {});
  }, []);

  // Check on mount
  useEffect(() => { recheckPermissions(); }, [recheckPermissions]);

  // Re-check when app resumes (user returns from settings)
  useAppStateResume(recheckPermissions);

  const requestNotification = async () => {
    if (Platform.OS !== "android") { return; }
    if (Platform.Version >= 33) {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      setNotifGranted(result === PermissionsAndroid.RESULTS.GRANTED);
    } else {
      setNotifGranted(true);
    }
  };

  const requestOverlay = () => {
    if (Platform.OS !== "android") { return; }
    SheptNative.requestOverlayPermission();
  };

  const openA11y = () => {
    if (Platform.OS !== "android") { return; }
    SheptNative.openAccessibilitySettings();
  };

  const requestMic = async () => {
    if (Platform.OS !== "android") { return; }
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
    );
    setMicGranted(result === PermissionsAndroid.RESULTS.GRANTED);
  };

  const toggleLang = useCallback((code: string) => {
    setSelectedLangs((prev) => {
      if (prev.includes(code)) {
        return prev.filter((c) => c !== code);
      }
      return [...prev, code];
    });
  }, []);

  const canNext = (): boolean => {
    if (step === 1) {
      return selectedLangs.length > 0;
    }
    if (step === 2) {
      return notifGranted;
    }
    if (step === 3) {
      return overlayGranted;
    }
    if (step === 4) {
      return a11yGranted;
    }
    if (step === 5) {
      return micGranted;
    }
    if (step === 6) {
      return elevenLabsKey.trim().length > 0 || googleKey.trim().length > 0;
    }
    return true;
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleFinish = () => {
    setMany({
      languages: selectedLangs,
      primaryLanguage: selectedLangs[0] ?? "",
      sttProvider: provider,
      elevenLabsApiKey: elevenLabsKey,
      googleCloudApiKey: googleKey,
      onboardingComplete: true,
      autoStart: true,
    });
    router.replace("/");
  };

  const filteredLangs = LANGUAGES.filter((l) =>
    l.name.toLowerCase().includes(langSearch.toLowerCase())
  );

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.logo}>Shept</Text>
            <Text style={styles.stepTitle}>Voice to text, everywhere</Text>
            <Text style={styles.stepDesc}>
              Shept transcribes your speech and injects it into any text field.
            </Text>
          </View>
        );

      case 1:
        return (
          <View style={[styles.stepContent, { flex: 1 }]}>
            <Text style={styles.stepTitle}>Select Languages</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search languages..."
              placeholderTextColor="#999"
              value={langSearch}
              onChangeText={setLangSearch}
            />
            {selectedLangs.length > 0 && (
              <View style={styles.chipsRow}>
                {selectedLangs.map((code) => {
                  const lang = LANGUAGES.find((l) => l.code === code);
                  return (
                    <TouchableOpacity
                      key={code}
                      style={styles.chip}
                      onPress={() => toggleLang(code)}
                    >
                      <Text style={styles.chipText}>
                        {lang?.name ?? code} x
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
            <FlatList
              data={filteredLangs}
              keyExtractor={(item) => item.code}
              style={{ flex: 1 }}
              renderItem={({ item }) => {
                const selected = selectedLangs.includes(item.code);
                return (
                  <TouchableOpacity
                    style={[styles.langRow, selected && styles.langRowSelected]}
                    onPress={() => toggleLang(item.code)}
                  >
                    <Text
                      style={[
                        styles.langText,
                        selected && styles.langTextSelected,
                      ]}
                    >
                      {item.name}
                    </Text>
                    {selected && <Text style={styles.checkMark}>✓</Text>}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        );

      case 2:
        return (
          <PermissionStep
            title="Notification Permission"
            description="Required to keep the voice service running."
            buttonLabel="Allow Notifications"
            granted={notifGranted}
            onPress={requestNotification}
          />
        );

      case 3:
        return (
          <PermissionStep
            title="Overlay Permission"
            description="Allows the mic button to float over other apps."
            buttonLabel="Allow Overlay"
            granted={overlayGranted}
            onPress={requestOverlay}
          />
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Accessibility Service</Text>
            <Text style={styles.stepDesc}>
              Detects text fields and injects transcribed text.
            </Text>
            {a11yGranted ? (
              <Text style={styles.grantedText}>Enabled</Text>
            ) : (
              <>
                <Text style={styles.stepHint}>
                  Scroll to find Shept and enable it.
                </Text>
                <TouchableOpacity style={styles.permBtn} onPress={openA11y}>
                  <Text style={styles.permBtnText}>Open Accessibility Settings</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        );

      case 5:
        return (
          <PermissionStep
            title="Microphone Permission"
            description="Required to capture your voice for transcription."
            buttonLabel="Allow Microphone"
            granted={micGranted}
            onPress={requestMic}
          />
        );

      case 6:
        return (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.stepContent}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.stepTitle}>API Key Setup</Text>

              <Text style={styles.providerLabel}>Provider</Text>
              <View style={styles.providerRow}>
                <TouchableOpacity
                  style={[
                    styles.providerBtn,
                    provider === "elevenlabs" && styles.providerBtnActive,
                  ]}
                  onPress={() => setProvider("elevenlabs")}
                >
                  <Text
                    style={[
                      styles.providerBtnText,
                      provider === "elevenlabs" && styles.providerBtnTextActive,
                    ]}
                  >
                    ElevenLabs
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.providerBtn,
                    provider === "google" && styles.providerBtnActive,
                  ]}
                  onPress={() => setProvider("google")}
                >
                  <Text
                    style={[
                      styles.providerBtnText,
                      provider === "google" && styles.providerBtnTextActive,
                    ]}
                  >
                    Google Cloud
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>ElevenLabs API Key</Text>
              <TextInput
                style={styles.apiInput}
                secureTextEntry
                placeholder="Enter ElevenLabs API key"
                placeholderTextColor="#999"
                value={elevenLabsKey}
                onChangeText={setElevenLabsKey}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text
                style={styles.linkText}
                onPress={() =>
                  Linking.openURL(
                    "https://elevenlabs.io/app/settings/api-keys"
                  )
                }
              >
                Get your ElevenLabs API key at elevenlabs.io/app/settings/api-keys
              </Text>

              <Text style={[styles.fieldLabel, { marginTop: 24 }]}>
                Google Cloud API Key
              </Text>
              <TextInput
                style={styles.apiInput}
                secureTextEntry
                placeholder="Enter Google Cloud API key"
                placeholderTextColor="#999"
                value={googleKey}
                onChangeText={setGoogleKey}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text
                style={styles.linkText}
                onPress={() =>
                  Linking.openURL(
                    "https://console.cloud.google.com/apis/credentials"
                  )
                }
              >
                Get your Google Cloud API key at
                console.cloud.google.com/apis/credentials
              </Text>
            </ScrollView>
          </KeyboardAvoidingView>
        );

      case 7:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.logo}>Shept</Text>
            <Text style={styles.stepTitle}>You're all set!</Text>
            <Text style={styles.stepDesc}>
              Shept is ready to transcribe your voice.
            </Text>
            <TouchableOpacity style={styles.startBtn} onPress={handleFinish}>
              <Text style={styles.startBtnText}>Start Shept</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StepDots current={step} total={TOTAL_STEPS} />
      <View style={{ flex: 1 }}>{renderStep()}</View>
      {step < 7 && (
        <View style={styles.navRow}>
          {step > 0 ? (
            <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 80 }} />
          )}
          <TouchableOpacity
            style={[styles.nextBtn, !canNext() && styles.nextBtnDisabled]}
            onPress={handleNext}
            disabled={!canNext()}
          >
            <Text style={styles.nextBtnText}>Next</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ddd",
  },
  dotActive: {
    backgroundColor: "#333",
    width: 24,
  },
  stepContent: {
    paddingTop: 40,
  },
  logo: {
    fontSize: 48,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  stepDesc: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  stepHint: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
  grantedText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#16a34a",
    textAlign: "center",
    marginTop: 32,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    backgroundColor: "#333",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    color: "#fff",
    fontSize: 14,
  },
  langRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  langRowSelected: {
    backgroundColor: "#f0f4ff",
  },
  langText: {
    fontSize: 16,
  },
  langTextSelected: {
    fontWeight: "600",
  },
  checkMark: {
    fontSize: 18,
    color: "#333",
  },
  permBtn: {
    backgroundColor: "#333",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignSelf: "center",
    marginTop: 32,
  },
  permBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  providerLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
    marginTop: 16,
  },
  providerRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  providerBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  providerBtnActive: {
    backgroundColor: "#333",
    borderColor: "#333",
  },
  providerBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  providerBtnTextActive: {
    color: "#fff",
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  apiInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  linkText: {
    fontSize: 13,
    color: "#2563eb",
    marginTop: 8,
  },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  backBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  backBtnText: {
    fontSize: 16,
    color: "#666",
  },
  nextBtn: {
    backgroundColor: "#333",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  nextBtnDisabled: {
    backgroundColor: "#ccc",
  },
  nextBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  startBtn: {
    backgroundColor: "#333",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignSelf: "center",
    marginTop: 32,
  },
  startBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});
