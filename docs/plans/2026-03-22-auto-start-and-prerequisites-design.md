# Auto-Start Service & Prerequisite Checking

## Overview

Auto-start the main overlay service when all permissions and API keys are configured. Show individual issue cards on the home screen when prerequisites are missing.

## Approach

**Permission-Check-First Architecture:** On app launch (post-hydration) and foreground resume, run `checkPrerequisites()`. All pass → silent auto-start. Any fail → show issue cards, no service start.

## Prerequisite Check System

### Function: `checkPrerequisites()`

Runs on:

- App launch (after store hydration, if `onboardingComplete`)
- App foreground resume (`AppState` "active")

Returns:

```typescript
type PrerequisiteStatus = {
  overlay: boolean
  accessibility: boolean
  microphone: boolean
  notification: boolean // required on Android 13+
  apiKey: boolean // at least one key string is set
  apiKeyValid: boolean // proactive validation via test request
}
```

### Critical vs Non-Critical

All prerequisites are critical (block service start):

- Overlay, accessibility, microphone, apiKey — always required
- Notification — required on Android 13+ (auto-granted on older)
- apiKeyValid — only blocks if validation explicitly fails (network error = treat as valid)

### API Key Validation

Lightweight test request on app launch only (not on every foreground resume). Cache result for the session. Network failure → treat as valid, defer to transcription-time error.

## Home Screen Issue Cards

When prerequisites fail, home screen shows individual cards replacing the status box and demo section.

Each card has: icon, title, one-line description, action button.

| Priority | Title                   | Description                                            | Action                            |
| -------- | ----------------------- | ------------------------------------------------------ | --------------------------------- |
| 1        | Accessibility Service   | Shept needs accessibility access to detect text fields | "Enable" → accessibility settings |
| 2        | Overlay Permission      | Shept needs to draw over other apps for the mic button | "Grant" → request overlay         |
| 3        | Microphone Permission   | Shept needs mic access to record your voice            | "Grant" → request mic             |
| 4        | Notification Permission | Required for keeping the service running reliably      | "Grant" → request notification    |
| 5        | API Key Missing         | Set up an ElevenLabs or Google Cloud API key           | "Set up" → settings screen        |
| 6        | API Key Invalid         | Your [provider] API key is not working                 | "Update" → settings screen        |

Cards stack vertically, ordered by priority. All are required — no dismiss option.

When all resolved → cards disappear, service auto-starts, normal home (status + demo) appears.

## Auto-Start Flow

### App Launch

```
App opens → Hydrate store → onboardingComplete?
  ├─ No → /onboarding
  └─ Yes → checkPrerequisites()
              ├─ All pass → startOverlay() silently → normal home
              └─ Any fail → show issue cards, no service
```

### Foreground Resume

```
App returns to foreground → checkPrerequisites()
  ├─ All pass & not running → auto-start
  ├─ All pass & running → no-op
  ├─ Any fail & running → stop service, show cards
  └─ Any fail & not running → show cards
```

### After Fixing an Issue

Permission callback or AppState "active" triggers re-check. If all now pass → auto-start + switch to normal view.

### Manual Control

Start/Stop button remains on home screen. Auto-start is default but user can manually toggle.

## Error Handling

- API key validation network failure → treat key as valid
- Native module call failure → show generic error card
- Rapid app/settings switching → debounce checks (300ms)

## Edge Cases

- Fresh install: onboarding handles setup, auto-start after completion
- App killed/restarted: full prerequisite check on launch
- Permission revoked in foreground: caught on next foreground resume
- Multiple issues: all cards shown, disappear individually as resolved

## Testing

- Unit test `checkPrerequisites()` with mocked native module
- Test each issue card renders for specific prerequisite states
- Test auto-start triggers when all prerequisites pass
- Test foreground resume re-checks prerequisites
- Test fixing last prerequisite auto-starts service
