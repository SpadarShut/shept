import React from "react"
import { View, PermissionsAndroid } from "react-native"
import { router } from "expo-router"
import { IssueCard } from "./issue-card"
import type { PrerequisiteStatus } from "../hooks/use-prerequisites"
import SheptNative from "../../modules/shept-native/src/shept-native-module"

type IssueCardListProperties = {
  status: PrerequisiteStatus
  onActionComplete: () => void
}

type IssueDefinition = {
  key: keyof PrerequisiteStatus
  title: string
  description: string
  actionLabel: string
  onAction: () => void
}

const STATIC_ISSUES: Omit<IssueDefinition, "onAction">[] = [
  {
    key: "accessibility",
    title: "Accessibility Service",
    description: "Shept needs accessibility access to detect text fields",
    actionLabel: "Enable",
  },
  {
    key: "overlay",
    title: "Overlay Permission",
    description: "Shept needs to draw over other apps for the mic button",
    actionLabel: "Grant",
  },
  {
    key: "microphone",
    title: "Microphone Permission",
    description: "Shept needs mic access to record your voice",
    actionLabel: "Grant",
  },
  {
    key: "notification",
    title: "Notification Permission",
    description: "Required for keeping the service running reliably",
    actionLabel: "Grant",
  },
  {
    key: "apiKey",
    title: "API Key Missing",
    description: "Set up an ElevenLabs or Google Cloud API key",
    actionLabel: "Set up",
  },
]

function createAction(
  key: keyof PrerequisiteStatus,
  onActionComplete: () => void,
): () => void {
  const actions: Record<keyof PrerequisiteStatus, () => void> = {
    accessibility: () => SheptNative.openAccessibilitySettings(),
    overlay: () => SheptNative.requestOverlayPermission(),
    microphone: async () => {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      )
      onActionComplete()
    },
    notification: async () => {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      )
      onActionComplete()
    },
    apiKey: () => router.push("/settings"),
  }
  return actions[key]
}

export function IssueCardList({
  status,
  onActionComplete,
}: IssueCardListProperties) {
  const failedIssues = STATIC_ISSUES.filter((issue) => !status[issue.key])

  if (failedIssues.length === 0) return

  return (
    <View style={{ width: "100%" }}>
      {failedIssues.map((issue) => (
        <IssueCard
          key={issue.key}
          title={issue.title}
          description={issue.description}
          actionLabel={issue.actionLabel}
          onAction={createAction(issue.key, onActionComplete)}
        />
      ))}
    </View>
  )
}
