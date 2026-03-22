import { renderHook, act } from "@testing-library/react-native"
import { PermissionsAndroid, Platform } from "react-native"

import { usePrerequisites } from "../use-prerequisites"
import SheptNative from "../../../modules/shept-native/src/shept-native-module"

jest.mock("../../../modules/shept-native/src/shept-native-module", () => ({
  __esModule: true,
  default: {
    isOverlayPermissionGranted: jest.fn(),
    isAccessibilityEnabled: jest.fn(),
    isNotificationPermissionGranted: jest.fn(),
  },
}))

const mockNative = SheptNative as jest.Mocked<typeof SheptNative>

function mockAllGranted() {
  mockNative.isOverlayPermissionGranted.mockReturnValue(true)
  mockNative.isAccessibilityEnabled.mockReturnValue(true)
  mockNative.isNotificationPermissionGranted.mockReturnValue(true)
  jest.spyOn(PermissionsAndroid, "check").mockResolvedValue(true)
}

beforeAll(() => {
  Platform.OS = "android"
})

describe("usePrerequisites", () => {
  beforeEach(() => jest.clearAllMocks())

  it("returns all true when everything is granted and keys set", async () => {
    mockAllGranted()

    const { result } = renderHook(() =>
      usePrerequisites({
        elevenLabsApiKey: "key123",
        googleCloudApiKey: "",
        sttProvider: "elevenlabs",
      }),
    )
    await act(async () => {})

    expect(result.current.status.overlay).toBe(true)
    expect(result.current.status.accessibility).toBe(true)
    expect(result.current.status.microphone).toBe(true)
    expect(result.current.status.notification).toBe(true)
    expect(result.current.status.apiKey).toBe(true)
    expect(result.current.allPassed).toBe(true)
  })

  it("returns allPassed false when overlay missing", async () => {
    mockAllGranted()
    mockNative.isOverlayPermissionGranted.mockReturnValue(false)

    const { result } = renderHook(() =>
      usePrerequisites({
        elevenLabsApiKey: "key",
        googleCloudApiKey: "",
        sttProvider: "elevenlabs",
      }),
    )
    await act(async () => {})

    expect(result.current.status.overlay).toBe(false)
    expect(result.current.allPassed).toBe(false)
  })

  it("returns apiKey false when no keys set", async () => {
    mockAllGranted()

    const { result } = renderHook(() =>
      usePrerequisites({
        elevenLabsApiKey: "",
        googleCloudApiKey: "",
        sttProvider: "elevenlabs",
      }),
    )
    await act(async () => {})

    expect(result.current.status.apiKey).toBe(false)
    expect(result.current.allPassed).toBe(false)
  })
})
