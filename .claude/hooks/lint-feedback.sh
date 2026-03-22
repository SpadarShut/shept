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

TRACKER="/tmp/eslint-failures-$(echo "$FILE_PATH" | shasum | cut -d' ' -f1)"
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
