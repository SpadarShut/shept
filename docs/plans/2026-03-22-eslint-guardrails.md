# ESLint as AI Guardrails — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Set up shared ESLint config package, Prettier, Husky pre-commit/pre-push hooks, and Claude Code guardrail hooks across the pnpm monorepo.

**Architecture:** New `packages/eslint-config` exports flat config with 5 core rules + stack-specific plugin presets. Husky runs lint-staged (ESLint + Prettier) on pre-commit and tests on pre-push. Two Claude Code hooks prevent ESLint config edits and provide lint feedback on file edits.

**Tech Stack:** ESLint 9 (flat config), Prettier, Husky, lint-staged, eslint-plugin-no-comments, eslint-plugin-better-max-params, eslint-plugin-sonarjs, eslint-plugin-unicorn, eslint-plugin-security, eslint-plugin-react

---

### Task 1: Add `packages/*` to workspace config

**Files:**

- Modify: `pnpm-workspace.yaml`

**Step 1: Update pnpm-workspace.yaml**

Add `packages/*` to the workspace list:

```yaml
packages:
  - apps/*
  - packages/*

nodeLinker: hoisted
```

**Step 2: Verify**

Run: `pnpm install`
Expected: Clean install, no errors

**Step 3: Commit**

```bash
git add pnpm-workspace.yaml
git commit -m "chore: add packages/* to pnpm workspace"
```

---

### Task 2: Scaffold `packages/eslint-config` package

**Files:**

- Create: `packages/eslint-config/package.json`
- Create: `packages/eslint-config/index.mjs`

**Step 1: Create package.json**

```json
{
  "name": "@shept/eslint-config",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./index.mjs"
  },
  "peerDependencies": {
    "eslint": "^9.0.0"
  },
  "dependencies": {
    "eslint-plugin-no-comments": "*",
    "eslint-plugin-better-max-params": "*",
    "eslint-plugin-sonarjs": "*",
    "eslint-plugin-unicorn": "*",
    "eslint-plugin-security": "*",
    "eslint-plugin-react": "*",
    "globals": "*"
  }
}
```

Note: Use `dependencies` (not `devDependencies`) so consumers get transitive access to plugins.

**Step 2: Create minimal index.mjs stub**

```js
export const core = []
export const react = []
```

**Step 3: Install deps**

Run: `cd packages/eslint-config && pnpm install`
Expected: Dependencies resolve, lockfile updates

**Step 4: Commit**

```bash
git add packages/eslint-config/package.json packages/eslint-config/index.mjs pnpm-lock.yaml
git commit -m "chore: scaffold packages/eslint-config with plugin deps"
```

---

### Task 3: Implement core ESLint rules (5 guardrails)

**Files:**

- Modify: `packages/eslint-config/index.mjs`

**Step 1: Write the core config export**

Replace `index.mjs` with:

```js
import noComments from "eslint-plugin-no-comments"
import betterMaxParams from "eslint-plugin-better-max-params"

/** Core rules — applied to all JS/TS files in the monorepo */
export const core = [
  {
    plugins: {
      "no-comments": noComments,
      "better-max-params": betterMaxParams,
    },
    rules: {
      // === 5 Core Guardrails ===
      "no-comments/disallowComments": "error",
      "better-max-params/better-max-params": [
        "error",
        { constructor: 10, func: 2 },
      ],
      "max-lines-per-function": ["error", { max: 50, skipBlankLines: true }],
      "max-lines": ["error", { max: 250, skipBlankLines: true }],
      "no-magic-numbers": [
        "error",
        {
          detectObjects: false,
          enforceConst: true,
          ignore: [0, 1, -1, 2],
          ignoreArrayIndexes: true,
        },
      ],

      // === Additional Custom Rules ===
      complexity: ["error", 10],
      "max-depth": ["error", 4],
      "max-statements": ["error", 20],
      "max-classes-per-file": ["error", 1],
      "no-console": "error",
      "id-length": ["error", { min: 2 }],
      eqeqeq: ["error", "always"],
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "MemberExpression[object.name='process'][property.name='env']",
          message:
            "Direct process.env access forbidden. Use DI to get configuration",
        },
      ],
    },
  },
]

/** React preset — compose with core for React/RN apps */
export const react = []
```

**Step 2: Verify module loads**

Run: `node -e "import('@shept/eslint-config').then(m => console.log(Object.keys(m)))"`
Expected: `[ 'core', 'react' ]`

**Step 3: Commit**

```bash
git add packages/eslint-config/index.mjs
git commit -m "feat: implement 5 core ESLint guardrail rules"
```

---

### Task 4: Add recommended plugin presets (sonarjs, unicorn, security)

**Files:**

- Modify: `packages/eslint-config/index.mjs`

**Step 1: Add plugin imports and presets**

Add after the `core` export:

```js
import sonarjs from "eslint-plugin-sonarjs"
import unicorn from "eslint-plugin-unicorn"
import security from "eslint-plugin-security"

/** Recommended presets — code smells, modern JS, security */
export const recommended = [
  sonarjs.configs.recommended,
  unicorn.configs["recommended"],
  security.configs.recommended,
]
```

**Step 2: Verify module loads**

Run: `node -e "import('@shept/eslint-config').then(m => console.log(Object.keys(m)))"`
Expected: `[ 'core', 'react', 'recommended' ]`

**Step 3: Commit**

```bash
git add packages/eslint-config/index.mjs
git commit -m "feat: add sonarjs, unicorn, security recommended presets"
```

---

### Task 5: Add React plugin preset

**Files:**

- Modify: `packages/eslint-config/index.mjs`

**Step 1: Add React preset**

Replace the `react` export:

```js
import reactPlugin from "eslint-plugin-react"
import globals from "globals"

/** React preset — for React/React Native apps */
export const react = [
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat["jsx-runtime"],
  {
    languageOptions: {
      globals: globals.browser,
    },
    settings: {
      react: { version: "detect" },
    },
  },
]
```

**Step 2: Verify module loads**

Run: `node -e "import('@shept/eslint-config').then(m => console.log(Object.keys(m)))"`
Expected: `[ 'core', 'react', 'recommended' ]`

**Step 3: Commit**

```bash
git add packages/eslint-config/index.mjs
git commit -m "feat: add React plugin preset to shared ESLint config"
```

---

### Task 6: Install ESLint + shared config in mobile app

**Files:**

- Modify: `apps/mobile/package.json` (devDependencies)
- Create: `apps/mobile/eslint.config.mjs`

**Step 1: Add dependencies**

Run:

```bash
pnpm --filter mobile add -D eslint @shept/eslint-config
```

Note: `@shept/eslint-config` resolves via workspace protocol.

**Step 2: Create eslint.config.mjs**

```js
import { core, recommended, react } from "@shept/eslint-config"

export default [
  ...core,
  ...recommended,
  ...react,
  {
    ignores: [
      "android/**",
      "ios/**",
      ".expo/**",
      "node_modules/**",
      "modules/shept-native/android/**",
      "modules/shept-native/ios/**",
    ],
  },
]
```

**Step 3: Add lint script to mobile package.json**

Add to `scripts`:

```json
"lint": "eslint .",
"lint:fix": "eslint . --fix"
```

**Step 4: Run lint to verify config loads**

Run: `pnpm --filter mobile lint`
Expected: Lint runs (errors expected on existing code — that's fine, confirms config works)

**Step 5: Commit**

```bash
git add apps/mobile/package.json apps/mobile/eslint.config.mjs pnpm-lock.yaml
git commit -m "feat: wire mobile app to shared ESLint config"
```

---

### Task 7: Add root lint script

**Files:**

- Modify: `package.json` (root)

**Step 1: Add root lint script**

Add to root `package.json` scripts:

```json
"lint": "pnpm -r lint",
"lint:fix": "pnpm -r lint:fix"
```

**Step 2: Verify**

Run: `pnpm lint`
Expected: Runs lint across all workspaces with lint script

**Step 3: Commit**

```bash
git add package.json
git commit -m "chore: add root lint scripts"
```

---

### Task 8: Set up Prettier

**Files:**

- Create: `prettier.config.mjs` (root)
- Modify: `package.json` (root, devDependencies + scripts)

**Step 1: Install Prettier at root**

Run: `pnpm add -Dw prettier`

**Step 2: Create prettier.config.mjs at repo root**

```js
export default {
  semi: true,
  singleQuote: false,
  tabWidth: 2,
  trailingComma: "all",
}
```

**Step 3: Add format scripts to root package.json**

```json
"format": "prettier --write .",
"format:check": "prettier --check ."
```

**Step 4: Verify**

Run: `pnpm format:check`
Expected: Runs, reports files (may need formatting — that's fine)

**Step 5: Commit**

```bash
git add prettier.config.mjs package.json pnpm-lock.yaml
git commit -m "chore: add Prettier with shared config"
```

---

### Task 9: Set up Husky + lint-staged

**Files:**

- Create: `.husky/pre-commit`
- Create: `.husky/pre-push`
- Modify: `package.json` (root, devDependencies + lint-staged config)

**Step 1: Install husky and lint-staged at root**

Run: `pnpm add -Dw husky lint-staged`

**Step 2: Initialize husky**

Run: `pnpm dlx husky init`

This creates `.husky/` dir and adds `prepare` script to root package.json.

**Step 3: Create pre-commit hook**

Write `.husky/pre-commit`:

```bash
pnpm dlx lint-staged
```

**Step 4: Create pre-push hook**

Write `.husky/pre-push`:

```bash
pnpm test
```

**Step 5: Add lint-staged config to root package.json**

Add to root `package.json`:

```json
"lint-staged": {
  "*.{js,jsx,ts,tsx,mjs}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{json,md,yaml,yml}": [
    "prettier --write"
  ]
}
```

**Step 6: Verify pre-commit hook works**

Run: `echo "test" >> /tmp/test.txt && git add -A && git stash` (just test that husky runs)

Actually, better test:
Run: `pnpm dlx lint-staged --diff="HEAD~1"`
Expected: lint-staged runs ESLint + Prettier on changed files

**Step 7: Commit**

```bash
git add .husky/ package.json pnpm-lock.yaml
git commit -m "chore: add Husky pre-commit (lint-staged) and pre-push (tests) hooks"
```

---

### Task 10: Create Claude Code `protect-eslint` hook

**Files:**

- Modify: `.claude/settings.json` (create if absent)

**Step 1: Create/update .claude/settings.json with protect-eslint hook**

Add a `PreToolUse` hook that blocks edits to `eslint.config.mjs` files:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hook": "FILEPATH=\"$(echo \"$CLAUDE_TOOL_INPUT\" | jq -r '.file_path // .filePath // \"\"')\"; FILENAME=\"$(basename \"$FILEPATH\")\"; if [ \"$FILENAME\" = \"eslint.config.mjs\" ]; then echo '{\"decision\":\"block\",\"reason\":\"Modifying eslint.config.mjs is forbidden. If a rule makes your task impossible, report to the user and explain why.\"}'; else echo '{\"decision\":\"approve\"}'; fi"
      }
    ]
  }
}
```

**Step 2: Verify hook triggers**

Attempt an edit to `apps/mobile/eslint.config.mjs` — should be blocked.

**Step 3: Commit**

```bash
git add .claude/settings.json
git commit -m "chore: add Claude Code hook to protect ESLint config from AI edits"
```

---

### Task 11: Create Claude Code lint-feedback hook

**Files:**

- Modify: `.claude/settings.json`
- Create: `.claude/hooks/lint-feedback.sh`

**Step 1: Create lint-feedback.sh**

```bash
#!/bin/bash
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.filePath // ""')

if [[ -z "$FILE_PATH" || ! -f "$FILE_PATH" ]]; then
  echo '{"decision": "approve"}'
  exit 0
fi

case "$FILE_PATH" in
  *.js|*.jsx|*.ts|*.tsx|*.mjs)
    ;;
  *)
    echo '{"decision": "approve"}'
    exit 0
    ;;
esac

TRACKER="/tmp/eslint-failures-$(echo "$FILE_PATH" | md5sum | cut -d' ' -f1)"
COUNT=0
if [[ -f "$TRACKER" ]]; then
  COUNT=$(cat "$TRACKER")
fi

LINT_OUTPUT=$(npx eslint --no-warn-ignored "$FILE_PATH" 2>&1)
LINT_EXIT=$?

if [[ $LINT_EXIT -ne 0 ]]; then
  COUNT=$((COUNT + 1))
  echo "$COUNT" > "$TRACKER"

  if [[ $COUNT -ge 3 ]]; then
    rm -f "$TRACKER"
    jq -n --arg output "$LINT_OUTPUT" '{
      decision: "block",
      reason: ("ESLint failed 3 times on this file. STOP and ask the user for help.\n\n" + $output)
    }'
  else
    jq -n --arg output "$LINT_OUTPUT" --argjson attempt "$COUNT" '{
      decision: "approve",
      reason: ("ESLint errors (attempt " + ($attempt|tostring) + "/3). Fix these:\n\n" + $output)
    }'
  fi
else
  rm -f "$TRACKER"
  echo '{"decision": "approve"}'
fi
```

**Step 2: Make executable**

Run: `chmod +x .claude/hooks/lint-feedback.sh`

**Step 3: Add PostToolUse hook to settings.json**

Update `.claude/settings.json` to add:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hook": "FILEPATH=\"$(echo \"$CLAUDE_TOOL_INPUT\" | jq -r '.file_path // .filePath // \"\"')\"; FILENAME=\"$(basename \"$FILEPATH\")\"; if [ \"$FILENAME\" = \"eslint.config.mjs\" ]; then echo '{\"decision\":\"block\",\"reason\":\"Modifying eslint.config.mjs is forbidden. If a rule makes your task impossible, report to the user and explain why.\"}'; else echo '{\"decision\":\"approve\"}'; fi"
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hook": ".claude/hooks/lint-feedback.sh"
      }
    ]
  }
}
```

**Step 4: Commit**

```bash
git add .claude/settings.json .claude/hooks/lint-feedback.sh
git commit -m "chore: add Claude Code lint-feedback hook with 3-failure escalation"
```

---

### Task 12: Fix existing code to pass ESLint (or add targeted ignores)

**Files:**

- Modify: various files in `apps/mobile/`

**Step 1: Run lint and capture errors**

Run: `pnpm --filter mobile lint 2>&1 | head -100`

**Step 2: Triage errors**

For each error category, decide:

- **Fix:** if the fix is straightforward (e.g., add `const` for magic numbers, use `===`)
- **Disable per-line:** NOT allowed (no-comments plugin blocks `// eslint-disable`)
- **Adjust rule config:** NOT allowed (protect-eslint hook blocks config edits)
- **Add to ignores in eslint.config.mjs:** Only for generated/vendored files

This step is exploratory — fix what's reasonable, document what needs user decision.

**Step 3: Run lint again to verify progress**

Run: `pnpm --filter mobile lint`
Expected: Reduced errors, ideally clean

**Step 4: Commit**

```bash
git add -A
git commit -m "fix: resolve ESLint errors in existing mobile app code"
```

---

### Task 13: Format all existing code with Prettier

**Files:**

- Modify: various files across the repo

**Step 1: Run Prettier write**

Run: `pnpm format`

**Step 2: Verify**

Run: `pnpm format:check`
Expected: All files formatted

**Step 3: Commit**

```bash
git add -A
git commit -m "style: format all files with Prettier"
```

---

### Task 14: Final verification

**Step 1: Run full lint**

Run: `pnpm lint`
Expected: Clean (0 errors)

**Step 2: Run format check**

Run: `pnpm format:check`
Expected: Clean

**Step 3: Run tests**

Run: `pnpm test`
Expected: All tests pass

**Step 4: Test pre-commit hook**

Create a test file, stage it, attempt commit:

```bash
echo "const x = 42;" > /tmp/test-lint.js
# Husky should trigger lint-staged on commit
```

**Step 5: Verify Claude Code hooks are in settings.json**

Run: `cat .claude/settings.json | jq .hooks`
Expected: Both PreToolUse and PostToolUse hooks present
