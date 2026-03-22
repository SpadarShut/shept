# Auto-Start & Prerequisites Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Auto-start overlay service when all permissions/keys are set; show issue cards on home screen when something is missing.

**Architecture:** `checkPrerequisites()` hook runs on launch + foreground resume. Returns typed status object. Home screen conditionally renders issue cards or normal UI based on result. Service auto-starts only when all critical prerequisites pass.

**Tech Stack:** React Native, TypeScript, Zustand, jest-expo, SheptNative Kotlin module

---

### Task 1: Create `usePrerequisites` hook with tests

**Files:**

- Create: `apps/mobile/src/hooks/use-prerequisites.ts`
- Create: `apps/mobile/src/hooks/__tests__/use-prerequisites.test.ts`

**Step 1: Write the failing test**

Create `apps/mobile/src/hooks/__tests__/use-prerequisites.test.ts`:

```typescript
import { renderHook, act } from "@testing-library/react-native"
import { usePrerequisites, PrerequisiteStatus } from "../use-prerequisites"
import SheptNative from "../../../modules/shept-native/src/SheptNativeModule"
import { PermissionsAndroid, Platform } from "react-native"

jest.mock("../../../modules/shept-native/src/SheptNativeModule", () => ({
  __esModule: true,
  default: {
    isOverlayPermissionGranted: jest.fn(),
    isAccessibilityEnabled: jest.fn(),
    isNotificationPermissionGranted: jest.fn(),
  },
}))

jest.mock("react-native", () => {
  const actual = jest.requireActual("react-native")
  return {
    ...actual,
    Platform: { OS: "android", Version: 33 },
    PermissionsAndroid: {
      check: jest.fn(),
      PERMISSIONS: { RECORD_AUDIO: "android.permission.RECORD_AUDIO" },
    },
  }
})

const mockNative = SheptNative as jest.Mocked<typeof SheptNative>
const mockPermsCheck = PermissionsAndroid.check as jest.Mock

describe("usePrerequisites", () => {
  beforeEach(() => jest.clearAllMocks())

  it("returns all true when everything is granted and keys set", async () => {
    mockNative.isOverlayPermissionGranted.mockReturnValue(true)
    mockNative.isAccessibilityEnabled.mockReturnValue(true)
    mockNative.isNotificationPermissionGranted.mockReturnValue(true)
    mockPermsCheck.mockResolvedValue(true)

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
    mockNative.isOverlayPermissionGranted.mockReturnValue(false)
    mockNative.isAccessibilityEnabled.mockReturnValue(true)
    mockNative.isNotificationPermissionGranted.mockReturnValue(true)
    mockPermsCheck.mockResolvedValue(true)

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
    mockNative.isOverlayPermissionGranted.mockReturnValue(true)
    mockNative.isAccessibilityEnabled.mockReturnValue(true)
    mockNative.isNotificationPermissionGranted.mockReturnValue(true)
    mockPermsCheck.mockResolvedValue(true)

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
```

**Step 2: Run test to verify it fails**

Run: `cd apps/mobile && pnpm test:js -- --testPathPattern use-prerequisites`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

Create `apps/mobile/src/hooks/use-prerequisites.ts`:

```typescript
import { useState, useEffect, useCallback, useRef } from "react"
import { Platform, PermissionsAndroid, AppState } from "react-native"
import SheptNative from "../../modules/shept-native/src/SheptNativeModule"

export type PrerequisiteStatus = {
  overlay: boolean
  accessibility: boolean
  microphone: boolean
  notification: boolean
  apiKey: boolean
}

type PrerequisiteInput = {
  elevenLabsApiKey: string
  googleCloudApiKey: string
  sttProvider: "elevenlabs" | "google"
}

export function usePrerequisites(input: PrerequisiteInput) {
  const [status, setStatus] = useState<PrerequisiteStatus>({
    overlay: false,
    accessibility: false,
    microphone: false,
    notification: false,
    apiKey: false,
  })

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const check = useCallback(async () => {
    if (Platform.OS !== "android") {
      setStatus({
        overlay: true,
        accessibility: true,
        microphone: true,
        notification: true,
        apiKey: true,
      })
      return
    }

    const overlay = SheptNative.isOverlayPermissionGranted()
    const accessibility = SheptNative.isAccessibilityEnabled()
    const notification = SheptNative.isNotificationPermissionGranted()

    let microphone = false
    try {
      microphone = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      )
    } catch {}

    const apiKey =
      input.sttProvider === "elevenlabs"
        ? input.elevenLabsApiKey.length > 0
        : input.googleCloudApiKey.length > 0

    setStatus({ overlay, accessibility, microphone, notification, apiKey })
  }, [input.elevenLabsApiKey, input.googleCloudApiKey, input.sttProvider])

  // Check on mount
  useEffect(() => {
    check()
  }, [check])

  // Re-check on foreground resume with debounce
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(check, 300)
      }
    })
    return () => {
      sub.remove()
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [check])

  const allPassed = Object.values(status).every(Boolean)

  return { status, allPassed, recheck: check }
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/mobile && pnpm test:js -- --testPathPattern use-prerequisites`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/mobile/src/hooks/use-prerequisites.ts apps/mobile/src/hooks/__tests__/use-prerequisites.test.ts
git commit -m "feat: add usePrerequisites hook with tests"
```

---

### Task 2: Create `IssueCard` component with tests

**Files:**

- Create: `apps/mobile/src/components/IssueCard.tsx`
- Create: `apps/mobile/src/components/__tests__/IssueCard.test.tsx`

**Step 1: Write the failing test**

Create `apps/mobile/src/components/__tests__/IssueCard.test.tsx`:

```typescript
import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { IssueCard } from "../IssueCard";

describe("IssueCard", () => {
  it("renders title and description", () => {
    const { getByText } = render(
      <IssueCard
        title="Overlay Permission"
        description="Shept needs to draw over other apps"
        actionLabel="Grant"
        onAction={jest.fn()}
      />
    );
    expect(getByText("Overlay Permission")).toBeTruthy();
    expect(getByText("Shept needs to draw over other apps")).toBeTruthy();
  });

  it("calls onAction when button pressed", () => {
    const onAction = jest.fn();
    const { getByText } = render(
      <IssueCard
        title="Test"
        description="Desc"
        actionLabel="Fix"
        onAction={onAction}
      />
    );
    fireEvent.press(getByText("Fix"));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/mobile && pnpm test:js -- --testPathPattern IssueCard`
Expected: FAIL — module not found

**Step 3: Install test dependency if needed, then write implementation**

Run: `cd apps/mobile && pnpm add -D @testing-library/react-native` (if not already installed)

Create `apps/mobile/src/components/IssueCard.tsx`:

```tsx
import React from "react"
import { View, Text, TouchableOpacity, StyleSheet } from "react-native"

type Props = {
  title: string
  description: string
  actionLabel: string
  onAction: () => void
}

export function IssueCard({
  title,
  description,
  actionLabel,
  onAction,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <TouchableOpacity style={styles.actionBtn} onPress={onAction}>
        <Text style={styles.actionText}>{actionLabel}</Text>
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
```

**Step 4: Run test to verify it passes**

Run: `cd apps/mobile && pnpm test:js -- --testPathPattern IssueCard`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/mobile/src/components/IssueCard.tsx apps/mobile/src/components/__tests__/IssueCard.test.tsx
git commit -m "feat: add IssueCard component with tests"
```

---

### Task 3: Create `IssueCardList` component with tests

**Files:**

- Create: `apps/mobile/src/components/IssueCardList.tsx`
- Create: `apps/mobile/src/components/__tests__/IssueCardList.test.tsx`

**Step 1: Write the failing test**

Create `apps/mobile/src/components/__tests__/IssueCardList.test.tsx`:

```typescript
import React from "react";
import { render } from "@testing-library/react-native";
import { IssueCardList } from "../IssueCardList";
import type { PrerequisiteStatus } from "../../hooks/use-prerequisites";

// Mock router
jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));

// Mock SheptNative
jest.mock("../../../modules/shept-native/src/SheptNativeModule", () => ({
  __esModule: true,
  default: {
    requestOverlayPermission: jest.fn(),
    openAccessibilitySettings: jest.fn(),
  },
}));

// Mock PermissionsAndroid
jest.mock("react-native", () => {
  const actual = jest.requireActual("react-native");
  return {
    ...actual,
    PermissionsAndroid: {
      request: jest.fn(),
      PERMISSIONS: {
        RECORD_AUDIO: "android.permission.RECORD_AUDIO",
        POST_NOTIFICATIONS: "android.permission.POST_NOTIFICATIONS",
      },
      RESULTS: { GRANTED: "granted" },
    },
  };
});

describe("IssueCardList", () => {
  const allFailed: PrerequisiteStatus = {
    overlay: false,
    accessibility: false,
    microphone: false,
    notification: false,
    apiKey: false,
  };

  it("renders card for each failed prerequisite", () => {
    const { getByText } = render(
      <IssueCardList status={allFailed} onActionComplete={jest.fn()} />
    );
    expect(getByText("Accessibility Service")).toBeTruthy();
    expect(getByText("Overlay Permission")).toBeTruthy();
    expect(getByText("Microphone Permission")).toBeTruthy();
    expect(getByText("Notification Permission")).toBeTruthy();
    expect(getByText("API Key Missing")).toBeTruthy();
  });

  it("renders no cards when all pass", () => {
    const allPassed: PrerequisiteStatus = {
      overlay: true,
      accessibility: true,
      microphone: true,
      notification: true,
      apiKey: true,
    };
    const { queryByText } = render(
      <IssueCardList status={allPassed} onActionComplete={jest.fn()} />
    );
    expect(queryByText("Accessibility Service")).toBeNull();
    expect(queryByText("Overlay Permission")).toBeNull();
  });

  it("renders only failed items", () => {
    const partial: PrerequisiteStatus = {
      overlay: true,
      accessibility: false,
      microphone: true,
      notification: true,
      apiKey: false,
    };
    const { getByText, queryByText } = render(
      <IssueCardList status={partial} onActionComplete={jest.fn()} />
    );
    expect(getByText("Accessibility Service")).toBeTruthy();
    expect(getByText("API Key Missing")).toBeTruthy();
    expect(queryByText("Overlay Permission")).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/mobile && pnpm test:js -- --testPathPattern IssueCardList`
Expected: FAIL — module not found

**Step 3: Write implementation**

Create `apps/mobile/src/components/IssueCardList.tsx`:

```tsx
import React from "react"
import { View, PermissionsAndroid } from "react-native"
import { router } from "expo-router"
import { IssueCard } from "./IssueCard"
import type { PrerequisiteStatus } from "../hooks/use-prerequisites"
import SheptNative from "../../modules/shept-native/src/SheptNativeModule"

type Props = {
  status: PrerequisiteStatus
  onActionComplete: () => void
}

type IssueDef = {
  key: keyof PrerequisiteStatus
  title: string
  description: string
  actionLabel: string
  onAction: () => void
}

export function IssueCardList({ status, onActionComplete }: Props) {
  const issues: IssueDef[] = [
    {
      key: "accessibility",
      title: "Accessibility Service",
      description: "Shept needs accessibility access to detect text fields",
      actionLabel: "Enable",
      onAction: () => {
        SheptNative.openAccessibilitySettings()
      },
    },
    {
      key: "overlay",
      title: "Overlay Permission",
      description: "Shept needs to draw over other apps for the mic button",
      actionLabel: "Grant",
      onAction: () => {
        SheptNative.requestOverlayPermission()
      },
    },
    {
      key: "microphone",
      title: "Microphone Permission",
      description: "Shept needs mic access to record your voice",
      actionLabel: "Grant",
      onAction: async () => {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        )
        onActionComplete()
      },
    },
    {
      key: "notification",
      title: "Notification Permission",
      description: "Required for keeping the service running reliably",
      actionLabel: "Grant",
      onAction: async () => {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        )
        onActionComplete()
      },
    },
    {
      key: "apiKey",
      title: "API Key Missing",
      description: "Set up an ElevenLabs or Google Cloud API key",
      actionLabel: "Set up",
      onAction: () => {
        router.push("/settings")
      },
    },
  ]

  const failedIssues = issues.filter((issue) => !status[issue.key])

  if (failedIssues.length === 0) return null

  return (
    <View style={{ width: "100%" }}>
      {failedIssues.map((issue) => (
        <IssueCard
          key={issue.key}
          title={issue.title}
          description={issue.description}
          actionLabel={issue.actionLabel}
          onAction={issue.onAction}
        />
      ))}
    </View>
  )
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/mobile && pnpm test:js -- --testPathPattern IssueCardList`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/mobile/src/components/IssueCardList.tsx apps/mobile/src/components/__tests__/IssueCardList.test.tsx
git commit -m "feat: add IssueCardList component with tests"
```

---

### Task 4: Integrate prerequisites into home screen

**Files:**

- Modify: `apps/mobile/app/index.tsx`

**Step 1: Write the failing test**

Create `apps/mobile/app/__tests__/index.test.tsx`:

```typescript
import React from "react";
import { render } from "@testing-library/react-native";

// Mock expo-router
jest.mock("expo-router", () => ({
  router: { replace: jest.fn(), push: jest.fn() },
}));

// Mock SheptNative
jest.mock("../../modules/shept-native/src/SheptNativeModule", () => ({
  __esModule: true,
  default: {
    isOverlayPermissionGranted: jest.fn(() => true),
    isAccessibilityEnabled: jest.fn(() => true),
    isNotificationPermissionGranted: jest.fn(() => true),
    startOverlay: jest.fn(),
    stopOverlay: jest.fn(),
    getServiceStatus: jest.fn(() => "idle"),
    getLastTranscription: jest.fn(() => ""),
    requestOverlayPermission: jest.fn(),
    openAccessibilitySettings: jest.fn(),
  },
}));

// Mock PermissionsAndroid
jest.mock("react-native/Libraries/PermissionsAndroid/PermissionsAndroid", () => ({
  check: jest.fn(() => Promise.resolve(true)),
  request: jest.fn(() => Promise.resolve("granted")),
  PERMISSIONS: {
    RECORD_AUDIO: "android.permission.RECORD_AUDIO",
    POST_NOTIFICATIONS: "android.permission.POST_NOTIFICATIONS",
  },
  RESULTS: { GRANTED: "granted" },
}));

// Mock settings store
const mockStore: Record<string, any> = {
  hydrated: true,
  onboardingComplete: true,
  autoStart: true,
  elevenLabsApiKey: "test-key",
  googleCloudApiKey: "",
  sttProvider: "elevenlabs",
  hydrate: jest.fn(),
};

jest.mock("../../src/stores/settings-store", () => ({
  useSettingsStore: (selector: (s: any) => any) => selector(mockStore),
}));

import HomeScreen from "../index";
import SheptNative from "../../modules/shept-native/src/SheptNativeModule";

describe("HomeScreen", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows issue cards when accessibility is disabled", async () => {
    (SheptNative.isAccessibilityEnabled as jest.Mock).mockReturnValue(false);

    const { findByText, queryByText } = render(<HomeScreen />);

    expect(await findByText("Accessibility Service")).toBeTruthy();
    expect(queryByText("See in action")).toBeNull();
  });

  it("shows normal UI and auto-starts when all prerequisites pass", async () => {
    (SheptNative.isOverlayPermissionGranted as jest.Mock).mockReturnValue(true);
    (SheptNative.isAccessibilityEnabled as jest.Mock).mockReturnValue(true);
    (SheptNative.isNotificationPermissionGranted as jest.Mock).mockReturnValue(true);

    const { findByText, queryByText } = render(<HomeScreen />);

    expect(await findByText("See in action")).toBeTruthy();
    expect(queryByText("Accessibility Service")).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/mobile && pnpm test:js -- --testPathPattern "app/__tests__/index"`
Expected: FAIL — test expectations don't match current implementation

**Step 3: Modify home screen**

Modify `apps/mobile/app/index.tsx` — replace the entire file content with:

```typescript
import { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useSettingsStore } from "../src/stores/settings-store";
import SheptNative from "../modules/shept-native/src/SheptNativeModule";
import { usePrerequisites } from "../src/hooks/use-prerequisites";
import { IssueCardList } from "../src/components/IssueCardList";

export default function HomeScreen() {
  const hydrated = useSettingsStore((s) => s.hydrated);
  const onboardingComplete = useSettingsStore((s) => s.onboardingComplete);
  const autoStart = useSettingsStore((s) => s.autoStart);
  const elevenLabsApiKey = useSettingsStore((s) => s.elevenLabsApiKey);
  const googleCloudApiKey = useSettingsStore((s) => s.googleCloudApiKey);
  const sttProvider = useSettingsStore((s) => s.sttProvider);
  const hydrate = useSettingsStore((s) => s.hydrate);

  const [serviceStatus, setServiceStatus] = useState("idle");
  const [lastTranscription, setLastTranscription] = useState("");
  const [serviceRunning, setServiceRunning] = useState(false);
  const serviceStartedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const inputRef = useRef<TextInput>(null);

  const { status: prereqStatus, allPassed, recheck } = usePrerequisites({
    elevenLabsApiKey,
    googleCloudApiKey,
    sttProvider,
  });

  const pollStatus = useCallback(() => {
    if (Platform.OS !== "android") return;
    try {
      const status = SheptNative.getServiceStatus();
      setServiceStatus(status);
      if (status !== "idle") {
        setServiceRunning(true);
        serviceStartedRef.current = true;
      } else {
        setServiceRunning(serviceStartedRef.current);
      }
      const transcription = SheptNative.getLastTranscription();
      setLastTranscription(transcription);
    } catch {}
  }, []);

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (hydrated && !onboardingComplete) {
      router.replace("/onboarding");
    }
  }, [hydrated, onboardingComplete]);

  // Auto-start when all prerequisites pass
  useEffect(() => {
    if (
      hydrated &&
      onboardingComplete &&
      autoStart &&
      allPassed &&
      Platform.OS === "android" &&
      !serviceStartedRef.current
    ) {
      SheptNative.startOverlay();
      setServiceRunning(true);
      serviceStartedRef.current = true;
      setTimeout(pollStatus, 500);
    }
  }, [hydrated, onboardingComplete, autoStart, allPassed, pollStatus]);

  // Stop service if prerequisites no longer met
  useEffect(() => {
    if (
      hydrated &&
      onboardingComplete &&
      !allPassed &&
      serviceStartedRef.current &&
      Platform.OS === "android"
    ) {
      SheptNative.stopOverlay();
      setServiceRunning(false);
      serviceStartedRef.current = false;
      setServiceStatus("idle");
    }
  }, [hydrated, onboardingComplete, allPassed]);

  // Pulse animation for recording dot
  useEffect(() => {
    if (serviceStatus === "recording") {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [serviceStatus, pulseAnim]);

  // Poll service status
  useEffect(() => {
    if (Platform.OS !== "android") return;
    pollStatus();
    intervalRef.current = setInterval(pollStatus, 2000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pollStatus]);

  const getStatusDisplay = () => {
    if (!serviceRunning) {
      return { label: "Not running", color: "#999" };
    }
    switch (serviceStatus) {
      case "recording":
        return { label: "Recording...", color: "#D32F2F" };
      case "transcribing":
        return { label: "Transcribing...", color: "#FF9800" };
      default:
        return { label: "Ready", color: "#4CAF50" };
    }
  };

  const handleToggleService = async () => {
    if (Platform.OS !== "android") return;
    if (serviceRunning) {
      SheptNative.stopOverlay();
      setServiceStatus("idle");
      setServiceRunning(false);
      serviceStartedRef.current = false;
    } else {
      if (!allPassed) return;
      SheptNative.startOverlay();
      setServiceRunning(true);
      serviceStartedRef.current = true;
      setTimeout(pollStatus, 500);
    }
  };

  if (!hydrated || !onboardingComplete) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#333" />
      </View>
    );
  }

  const { label: statusLabel, color: dotColor } = getStatusDisplay();

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Shept</Text>
        <Text style={styles.subtitle}>Voice to text, everywhere</Text>

        {!allPassed ? (
          <View style={styles.issueSection}>
            <Text style={styles.issueHeader}>
              To start, set up the following:
            </Text>
            <IssueCardList status={prereqStatus} onActionComplete={recheck} />
          </View>
        ) : (
          <>
            <View style={styles.statusBox}>
              <Text style={styles.statusLabel}>Service Status</Text>
              <View style={styles.statusRow}>
                <Animated.View
                  style={[
                    styles.statusDot,
                    { backgroundColor: dotColor },
                    serviceStatus === "recording" && { opacity: pulseAnim },
                  ]}
                />
                <Text style={styles.statusValue}>{statusLabel}</Text>
              </View>
              {lastTranscription !== "" && (
                <Text style={styles.transcriptionText} numberOfLines={3}>
                  {lastTranscription}
                </Text>
              )}
            </View>
            <View style={styles.demoSection}>
              <Text style={styles.demoLabel}>See in action</Text>
              <TextInput
                ref={inputRef}
                style={styles.demoInput}
                placeholder="Focus here, then tap the overlay…"
                placeholderTextColor="#aaa"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => inputRef.current?.clear()}
              >
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
            </View>
            {Platform.OS === "android" && (
              <TouchableOpacity
                style={[
                  styles.serviceBtn,
                  serviceRunning && styles.serviceBtnStop,
                ]}
                onPress={handleToggleService}
              >
                <Text style={styles.serviceBtnText}>
                  {serviceRunning ? "Stop Service" : "Start Service"}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}

        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => router.push("/settings")}
        >
          <Text style={styles.settingsBtnText}>Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
  issueSection: {
    marginTop: 32,
    width: "85%",
  },
  issueHeader: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
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
  serviceBtn: {
    marginTop: 24,
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  serviceBtnStop: {
    backgroundColor: "#D32F2F",
  },
  serviceBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  settingsBtn: {
    marginTop: 16,
    backgroundColor: "#333",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  settingsBtnText: {
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
  clearBtn: {
    marginTop: 8,
    alignSelf: "flex-end",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  clearBtnText: {
    fontSize: 13,
    color: "#666",
  },
});
```

Key changes from original:

- Added `usePrerequisites` hook usage (lines importing + calling it)
- Auto-start now depends on `allPassed` instead of just `isOverlayPermissionGranted()`
- Added effect to stop service when prerequisites no longer met
- Home screen conditionally renders `IssueCardList` or normal status+demo UI
- Removed `AppState` listener from poll effect (now handled by `usePrerequisites`)
- `handleToggleService` checks `allPassed` before starting

**Step 4: Run all tests**

Run: `cd apps/mobile && pnpm test:js`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/mobile/app/index.tsx apps/mobile/app/__tests__/index.test.tsx
git commit -m "feat: integrate prerequisite checks into home screen with issue cards"
```

---

### Task 5: Build and verify on device

**Step 1: Build the Android app**

Run: `cd apps/mobile && pnpm android`

**Step 2: Manual verification checklist**

1. Fresh state (clear app data): should see onboarding
2. After onboarding: home screen shows "Ready" status, service auto-started
3. Revoke overlay permission in system settings, return to app: issue card appears, service stopped
4. Grant overlay permission via card: card disappears, service auto-starts
5. Revoke accessibility, return to app: accessibility card appears
6. Multiple revocations: all relevant cards shown

**Step 3: Commit any fixes**

```bash
git add -u
git commit -m "fix: address issues found during manual testing"
```
