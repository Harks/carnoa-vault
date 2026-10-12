#!/bin/bash
set -euo pipefail

# Developer-only, synthetic Mac .app packaging. No Developer ID, notarization,
# private keys or credential-related functionality are included.
if [[ "$#" -ne 1 || -z "$1" ]]; then
  echo "Usage: bash mac-companion/Scripts/build-synthetic-demo-app.sh EMPTY_OUTPUT_DIR" >&2
  exit 2
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
OUT="$1"
if [[ ! -d "$OUT" || -L "$OUT" ]]; then
  echo "Output must be an existing ordinary directory, not a symlink." >&2
  exit 2
fi

APP="$OUT/Carnoa Synthetic Demo.app"
if [[ -e "$APP" || -L "$APP" ]]; then
  echo "Refusing to overwrite an existing app bundle." >&2
  exit 2
fi

swift build --configuration release --package-path "$ROOT"
BINARY_DIR="$(swift build --configuration release --show-bin-path --package-path "$ROOT")"
BINARY="$BINARY_DIR/carnoa-companion-demo"
if [[ ! -f "$BINARY" || ! -x "$BINARY" ]]; then
  echo "Expected release-mode Swift executable is unavailable." >&2
  exit 2
fi

STAGING="$(mktemp -d "/tmp/carnoa-synthetic-app.XXXXXXXX")"
trap 'rm -rf "$STAGING"' EXIT
BUNDLE="$STAGING/Carnoa Synthetic Demo.app"
mkdir -p "$BUNDLE/Contents/MacOS"
cp "$BINARY" "$BUNDLE/Contents/MacOS/carnoa-companion-demo"
cp "$ROOT/Packaging/Info.plist" "$BUNDLE/Contents/Info.plist"
chmod 755 "$BUNDLE/Contents/MacOS/carnoa-companion-demo"

/usr/bin/plutil -lint "$BUNDLE/Contents/Info.plist" >/dev/null
# An ad-hoc signature detects accidental local package changes only. It does
# NOT establish publisher identity, trusted distribution or Gatekeeper approval.
/usr/bin/codesign --force --sign - --timestamp=none "$BUNDLE"
/usr/bin/codesign --verify --strict --verbose=2 "$BUNDLE"
bash "$ROOT/Scripts/verify-synthetic-demo-app.sh" "$BUNDLE"

if [[ -e "$APP" || -L "$APP" ]]; then
  echo "Refusing to replace concurrently created app bundle." >&2
  exit 2
fi
# This path is a developer-owned throwaway output; same-UID filesystem races
# are not fully mitigated and this output MUST NOT hold production secrets.
mv -n "$BUNDLE" "$APP"
if [[ -e "$BUNDLE" ]]; then
  echo "Concurrent destination creation prevented publishing the bundle." >&2
  exit 2
fi
bash "$ROOT/Scripts/verify-synthetic-demo-app.sh" "$APP"
echo "EXPERIMENTAL ad-hoc signed (NOT notarized) synthetic app created: $APP"
