import React from "react"
import { render } from "@testing-library/react-native"
import { IssueCardList } from "../issue-card-list"
import type { PrerequisiteStatus } from "../../hooks/use-prerequisites"

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }))

jest.mock("../../../modules/shept-native/src/shept-native-module", () => ({
  __esModule: true,
  default: {
    requestOverlayPermission: jest.fn(),
    openAccessibilitySettings: jest.fn(),
  },
}))

describe("IssueCardList", () => {
  const allFailed: PrerequisiteStatus = {
    overlay: false,
    accessibility: false,
    microphone: false,
    notification: false,
    apiKey: false,
  }

  it("renders card for each failed prerequisite", () => {
    const { getByText } = render(
      <IssueCardList status={allFailed} onActionComplete={jest.fn()} />,
    )
    expect(getByText("Accessibility Service")).toBeTruthy()
    expect(getByText("Overlay Permission")).toBeTruthy()
    expect(getByText("Microphone Permission")).toBeTruthy()
    expect(getByText("Notification Permission")).toBeTruthy()
    expect(getByText("API Key Missing")).toBeTruthy()
  })

  it("renders no cards when all pass", () => {
    const allPassed: PrerequisiteStatus = {
      overlay: true,
      accessibility: true,
      microphone: true,
      notification: true,
      apiKey: true,
    }
    const { queryByText } = render(
      <IssueCardList status={allPassed} onActionComplete={jest.fn()} />,
    )
    expect(queryByText("Accessibility Service")).toBeNull()
    expect(queryByText("Overlay Permission")).toBeNull()
  })

  it("renders only failed items", () => {
    const partial: PrerequisiteStatus = {
      overlay: true,
      accessibility: false,
      microphone: true,
      notification: true,
      apiKey: false,
    }
    const { getByText, queryByText } = render(
      <IssueCardList status={partial} onActionComplete={jest.fn()} />,
    )
    expect(getByText("Accessibility Service")).toBeTruthy()
    expect(getByText("API Key Missing")).toBeTruthy()
    expect(queryByText("Overlay Permission")).toBeNull()
  })
})
