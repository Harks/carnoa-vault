#!/bin/bash
set -euo pipefail

if [[ "$#" -ne 1 ]]; then
  echo "Usage: bash mac-companion/Scripts/verify-synthetic-demo-app.sh APP_BUNDLE" >&2
  exit 2
fi

APP="$1"
INFO="$APP/Contents/Info.plist"
BINARY="$APP/Contents/MacOS/carnoa-companion-demo"
if [[ ! -d "$APP" || -L "$APP" || ! -f "$INFO" ||
      ! -f "$BINARY" || ! -x "$BINARY" ]]; then
  echo "Invalid app bundle layout." >&2
  exit 2
fi
/usr/bin/plutil -lint "$INFO" >/dev/null
BUNDLE_ID="$(/usr/bin/plutil -extract CFBundleIdentifier raw -o - "$INFO")"
EXEC_NAME="$(/usr/bin/plutil -extract CFBundleExecutable raw -o - "$INFO")"
AGENT="$(/usr/bin/plutil -extract LSUIElement raw -o - "$INFO")"
if [[ "$BUNDLE_ID" != "app.carnoa.synthetic.preview" ||
      "$EXEC_NAME" != "carnoa-companion-demo" ||
      "$AGENT" != "true" ]]; then
  echo "Unexpected bundle metadata." >&2
  exit 2
fi
/usr/bin/codesign --verify --strict --verbose=2 "$APP" >/dev/null
DETAILS="$(/usr/bin/codesign --display --verbose=4 "$APP" 2>&1)"
if [[ "$DETAILS" != *"Signature=adhoc"* ]]; then
  echo "This experimental bundle must be ad-hoc signed only, not represented as a trusted release." >&2
  exit 2
fi
echo "Synthetic .app layout and ad-hoc integrity checked. NOT a Developer ID or notarized build."
