import { StyleSheet } from "react-native"

export const homeScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingVertical: 40,
    paddingBottom: 80,
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
  serviceButton: {
    marginTop: 24,
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  serviceButtonStop: {
    backgroundColor: "#D32F2F",
  },
  serviceButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  settingsButton: {
    marginTop: 16,
    backgroundColor: "#333",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  settingsButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  demoSection: {
    marginTop: 32,
    width: "80%",
  },
  demoLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  demoInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    backgroundColor: "#fafafa",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#333",
    minHeight: 100,
    textAlignVertical: "top",
  },
  clearButton: {
    marginTop: 8,
    alignSelf: "flex-end",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  clearButtonText: {
    fontSize: 13,
    color: "#666",
  },
})
