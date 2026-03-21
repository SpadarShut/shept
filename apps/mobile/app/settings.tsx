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

interface Language {
  code: string;
  name: string;
}

const LANGUAGES: Language[] = [
  { code: "be", name: "Belarusian" },
  { code: "en", name: "English" },
  { code: "ru", name: "Russian" },
  { code: "uk", name: "Ukrainian" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "pl", name: "Polish" },
  { code: "pt", name: "Portuguese" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "tr", name: "Turkish" },
  { code: "it", name: "Italian" },
];

export default function SettingsScreen() {
  const store = useSettingsStore();
  const [langSearch, setLangSearch] = useState("");

  const toggleLang = (code: string) => {
    const next = store.languages.includes(code)
      ? store.languages.filter((c) => c !== code)
      : [...store.languages, code];
    const primary = next.length > 0 ? (next.includes(store.primaryLanguage) ? store.primaryLanguage : next[0]) : "";
    store.setMany({ languages: next, primaryLanguage: primary });
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
        keyboardShouldPersistTaps="handled"
      >
        {/* Provider */}
        <Text style={styles.sectionTitle}>Provider</Text>
        <View style={styles.providerRow}>
          <TouchableOpacity
            style={[
              styles.providerBtn,
              store.sttProvider === "elevenlabs" && styles.providerBtnActive,
            ]}
            onPress={() => store.set("sttProvider", "elevenlabs")}
          >
            <Text
              style={[
                styles.providerBtnText,
                store.sttProvider === "elevenlabs" && styles.providerBtnTextActive,
              ]}
            >
              ElevenLabs
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.providerBtn,
              store.sttProvider === "google" && styles.providerBtnActive,
            ]}
            onPress={() => store.set("sttProvider", "google")}
          >
            <Text
              style={[
                styles.providerBtnText,
                store.sttProvider === "google" && styles.providerBtnTextActive,
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
          value={store.elevenLabsApiKey}
          onChangeText={(v) => store.set("elevenLabsApiKey", v)}
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
          value={store.googleCloudApiKey}
          onChangeText={(v) => store.set("googleCloudApiKey", v)}
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
        {store.languages.length > 0 && (
          <View style={styles.chipsRow}>
            {store.languages.map((code) => {
              const lang = LANGUAGES.find((l) => l.code === code);
              return (
                <TouchableOpacity
                  key={code}
                  style={styles.chip}
                  onPress={() => toggleLang(code)}
                >
                  <Text style={styles.chipText}>{lang?.name ?? code} x</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        {filteredLangs.map((item) => {
          const selected = store.languages.includes(item.code);
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
            value={store.autoStart}
            onValueChange={(v) => store.set("autoStart", v)}
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
