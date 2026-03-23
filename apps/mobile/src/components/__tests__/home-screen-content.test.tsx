import { render } from "@testing-library/react-native"
import { Animated } from "react-native"
import { HomeScreenContent } from "../home-screen-content"
import type { PrerequisiteStatus } from "../../hooks/use-prerequisites"

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (translationKey: string) => translationKey }),
}))

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }))

jest.mock("../../../modules/shept-native/src/shept-native-module", () => ({
  __esModule: true,
  default: {
    requestOverlayPermission: jest.fn(),
    openAccessibilitySettings: jest.fn(),
  },
}))

const allPassedStatus: PrerequisiteStatus = {
  overlay: true,
  accessibility: true,
  microphone: true,
  notification: true,
  apiKey: true,
}

const someFailedStatus: PrerequisiteStatus = {
  overlay: false,
  accessibility: false,
  microphone: true,
  notification: true,
  apiKey: true,
}

const baseProperties = {
  serviceStatus: "idle",
  serviceRunning: false,
  pulseAnimation: new Animated.Value(1),
  handleToggleService: jest.fn(),
  onActionComplete: jest.fn(),
}

describe("HomeScreenContent", () => {
  it("shows issue cards when allPassed is false", () => {
    const { getByText, queryByText } = render(
      <HomeScreenContent
        {...baseProperties}
        prereqStatus={someFailedStatus}
        allPassed={false}
      />,
    )
    expect(getByText("Overlay Permission")).toBeTruthy()
    expect(getByText("Accessibility Service")).toBeTruthy()
    expect(queryByText("home.status.notRunning")).toBeNull()
  })

  it("shows normal UI when allPassed is true", () => {
    const { getByText, queryByText } = render(
      <HomeScreenContent
        {...baseProperties}
        prereqStatus={allPassedStatus}
        allPassed={true}
      />,
    )
    expect(getByText("home.status.notRunning")).toBeTruthy()
    expect(queryByText("Overlay Permission")).toBeNull()
  })

  it("always shows settings button regardless of allPassed", () => {
    const { getByText: getByTextFailed } = render(
      <HomeScreenContent
        {...baseProperties}
        prereqStatus={someFailedStatus}
        allPassed={false}
      />,
    )
    expect(getByTextFailed("home.settings")).toBeTruthy()

    const { getByText: getByTextPassed } = render(
      <HomeScreenContent
        {...baseProperties}
        prereqStatus={allPassedStatus}
        allPassed={true}
      />,
    )
    expect(getByTextPassed("home.settings")).toBeTruthy()
  })
})
