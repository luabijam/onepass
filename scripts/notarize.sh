#!/bin/bash

set -e

APPLE_ID="${APPLE_ID:-}"
TEAM_ID="${TEAM_ID:-}"
APP_PASSWORD="${APP_PASSWORD:-}"
APP_PATH="${1:-}"
BUNDLE_ID="com.onepass.desktop"

if [ -z "$APPLE_ID" ]; then
    echo "Error: APPLE_ID environment variable is required"
    echo "Set it with: export APPLE_ID=your-apple-id@example.com"
    exit 1
fi

if [ -z "$TEAM_ID" ]; then
    echo "Error: TEAM_ID environment variable is required"
    echo "Set it with: export TEAM_ID=YOUR_TEAM_ID"
    exit 1
fi

if [ -z "$APP_PASSWORD" ]; then
    echo "Error: APP_PASSWORD environment variable is required"
    echo "Generate an app-specific password at https://appleid.apple.com"
    echo "Set it with: export APP_PASSWORD=xxxx-xxxx-xxxx-xxxx"
    exit 1
fi

if [ -z "$APP_PATH" ]; then
    echo "Usage: $0 <path-to-app-bundle>"
    echo "Example: $0 macos/build/Release/OnePass.app"
    exit 1
fi

if [ ! -d "$APP_PATH" ]; then
    echo "Error: App bundle not found: $APP_PATH"
    exit 1
fi

APP_NAME=$(basename "$APP_PATH")
ZIP_PATH="${APP_PATH%.app}.zip"

echo "Creating zip archive for notarization..."
ditto -c -k --keepParent "$APP_PATH" "$ZIP_PATH"

echo "Submitting for notarization..."
SUBMIT_OUTPUT=$(xcrun notarytool submit "$ZIP_PATH" \
    --apple-id "$APPLE_ID" \
    --team-id "$TEAM_ID" \
    --password "$APP_PASSWORD" \
    --wait 2>&1)

echo "$SUBMIT_OUTPUT"

if echo "$SUBMIT_OUTPUT" | grep -q "status: Accepted"; then
    echo "Notarization successful!"
    echo "Stapling notarization ticket to app..."
    xcrun stapler staple "$APP_PATH"
    echo "Stapling complete!"
    echo ""
    echo "App is now ready for distribution: $APP_PATH"
else
    echo "Notarization failed. Check the output above for details."
    echo "You can check logs with: xcrun notarytool log <submission-id> --apple-id \$APPLE_ID --team-id \$TEAM_ID --password \$APP_PASSWORD"
    exit 1
fi

rm -f "$ZIP_PATH"
