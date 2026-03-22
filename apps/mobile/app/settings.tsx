import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Switch,
  ScrollView,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSettingsStore } from "../src/stores/settings-store";
import { LANGUAGES } from "../src/constants/languages";

export default function SettingsScreen() {
  const sttProvider = useSettingsStore((s) => s.sttProvider);
  const elevenLabsApiKey = useSettingsStore((s) => s.elevenLabsApiKey);
  const googleCloudApiKey = useSettingsStore((s) => s.googleCloudApiKey);
  const languages = useSettingsStore((s) => s.languages);
  const primaryLanguage = useSettingsStore((s) => s.primaryLanguage);
  const autoStart = useSettingsStore((s) => s.autoStart);
  const set = useSettingsStore((s) => s.set);
  const setMany = useSettingsStore((s) => s.setMany);
  const [langSearch, setLangSearch] = useState("");

  const toggleLang = (code: string) => {
    const next = languages.includes(code)
      ? languages.filter((c) => c !== code)
      : [...languages, code];
    const primary = next.length > 0 ? (next.includes(primaryLanguage) ? primaryLanguage : next[0]) : "";
    setMany({ languages: next, primaryLanguage: primary });
  };

  const filteredLangs = LANGUAGES.filter((l) =>
    l.name.toLowerCase().includes(langSearch.toLowerCase())
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {/* Provider */}
        <Text style={styles.sectionTitle}>Provider</Text>
        <View style={styles.providerRow}>
          <TouchableOpacity
            style={[
              styles.providerBtn,
              sttProvider === "elevenlabs" && styles.providerBtnActive,
            ]}
            onPress={() => set("sttProvider", "elevenlabs")}
          >
            <Text
              style={[
                styles.providerBtnText,
                sttProvider === "elevenlabs" && styles.providerBtnTextActive,
              ]}
            >
              ElevenLabs
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.providerBtn,
              sttProvider === "google" && styles.providerBtnActive,
            ]}
            onPress={() => set("sttProvider", "google")}
          >
            <Text
              style={[
                styles.providerBtnText,
                sttProvider === "google" && styles.providerBtnTextActive,
              ]}
            >
              Google Cloud
            </Text>
          </TouchableOpacity>
        </View>

        {/* API Keys */}
        <Text style={styles.sectionTitle}>API Keys</Text>
        <Text style={styles.fieldLabel}>ElevenLabs</Text>
        <TextInput
          style={styles.apiInput}
          secureTextEntry
          placeholder="Enter API key"
          placeholderTextColor="#999"
          value={elevenLabsApiKey}
          onChangeText={(v) => set("elevenLabsApiKey", v)}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text
          style={styles.linkText}
          onPress={() =>
            Linking.openURL("https://elevenlabs.io/app/settings/api-keys")
          }
        >
          Get your ElevenLabs API key
        </Text>

        <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Google Cloud</Text>
        <TextInput
          style={styles.apiInput}
          secureTextEntry
          placeholder="Enter API key"
          placeholderTextColor="#999"
          value={googleCloudApiKey}
          onChangeText={(v) => set("googleCloudApiKey", v)}
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
          Get your Google Cloud API key
        </Text>

        {/* Languages */}
        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Languages</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search languages..."
          placeholderTextColor="#999"
          value={langSearch}
          onChangeText={setLangSearch}
        />
        {filteredLangs.map((item) => {
          const selected = languages.includes(item.code);
          return (
            <TouchableOpacity
              key={item.code}
              style={[styles.langRow, selected && styles.langRowSelected]}
              onPress={() => toggleLang(item.code)}
            >
              <Text
                style={[styles.langText, selected && styles.langTextSelected]}
              >
                {item.name}
              </Text>
              {selected && <Text style={styles.checkMark}>✓</Text>}
            </TouchableOpacity>
          );
        })}

        {/* Auto-start */}
        <View style={styles.autoStartRow}>
          <View>
            <Text style={styles.sectionTitle}>Auto-start</Text>
            <Text style={styles.autoStartDesc}>
              Start overlay on app launch
            </Text>
          </View>
          <Switch
            value={autoStart}
            onValueChange={(v) => set("autoStart", v)}
            trackColor={{ true: "#333" }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
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
    color: "#333"
  },
  linkText: {
    fontSize: 13,
    color: "#2563eb",
    marginTop: 6,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
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
  autoStartRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 32,
    paddingVertical: 8,
  },
  autoStartDesc: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
});
