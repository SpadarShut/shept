import { View, Text, TouchableOpacity, StyleSheet } from "react-native"

interface IssueCardProperties {
  title: string
  description: string
  actionLabel: string
  onAction: () => void
}

export function IssueCard(properties: IssueCardProperties) {
  return (
    <View style={styles.card}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{properties.title}</Text>
        <Text style={styles.description}>{properties.description}</Text>
      </View>
      <TouchableOpacity style={styles.actionBtn} onPress={properties.onAction}>
        <Text style={styles.actionText}>{properties.actionLabel}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#FF9800",
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: "#666",
  },
  actionBtn: {
    backgroundColor: "#FF9800",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  actionText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
})
