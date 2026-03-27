#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DESKTOP_DIR="$PROJECT_ROOT/packages/desktop"
MACOS_DIR="$DESKTOP_DIR/macos"

SIGNING_IDENTITY="${SIGNING_IDENTITY:-Developer ID Application}"

print_usage() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --identity <identity>  Signing identity (default: Developer ID Application)"
    echo "  --team <team-id>       Apple Developer Team ID"
    echo "  --help                 Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  SIGNING_IDENTITY       Signing identity to use"
    echo "  DEVELOPMENT_TEAM       Team ID for signing"
    echo ""
    echo "Examples:"
    echo "  $0 --team YOURTEAMID"
    echo "  SIGNING_IDENTITY=\"Developer ID Application: Your Name (TEAMID)\" $0"
}

TEAM_ID=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --identity)
            SIGNING_IDENTITY="$2"
            shift 2
            ;;
        --team)
            TEAM_ID="$2"
            shift 2
            ;;
        --help)
            print_usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            print_usage
            exit 1
            ;;
    esac
done

TEAM_ID="${TEAM_ID:-$DEVELOPMENT_TEAM}"

if [ -z "$TEAM_ID" ]; then
    echo "Error: Team ID is required"
    echo "Set it with --team YOURTEAMID or DEVELOPMENT_TEAM environment variable"
    exit 1
fi

cd "$MACOS_DIR"

if [ ! -d "desktop.xcworkspace" ]; then
    echo "Running pod install..."
    pod install
fi

echo "Building signed release..."
xcodebuild \
    -workspace desktop.xcworkspace \
    -scheme desktop-macOS \
    -configuration Release \
    -derivedDataPath build \
    DEVELOPMENT_TEAM="$TEAM_ID" \
    CODE_SIGN_IDENTITY="$SIGNING_IDENTITY" \
    CODE_SIGN_STYLE=Automatic

APP_PATH="build/Build/Products/Release/OnePass.app"

if [ ! -d "$APP_PATH" ]; then
    echo "Error: Build failed - app not found at $APP_PATH"
    exit 1
fi

echo "Verifying code signature..."
codesign --verify --verbose=2 "$APP_PATH"

echo ""
echo "Build successful!"
echo "Signed app: $MACOS_DIR/$APP_PATH"
echo ""
echo "To notarize for distribution, run:"
echo "  ./scripts/notarize.sh $MACOS_DIR/$APP_PATH"
