import { StyleSheet } from "react-native"

export const styles = StyleSheet.create({
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
    color: "#333",
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
})
