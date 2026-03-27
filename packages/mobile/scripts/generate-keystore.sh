#!/bin/bash
# Generate a release keystore for Android code signing
# Usage: ./scripts/generate-keystore.sh [options]
#
# Options:
#   -a, --alias       Key alias (default: onepass)
#   -f, --file        Keystore filename (default: release.keystore)
#   -v, --validity    Validity in days (default: 10000)
#   -d, --directory   Output directory (default: android/app)
#   -h, --help        Show this help message

set -e

# Default values
ALIAS="onepass"
FILENAME="release.keystore"
VALIDITY=10000
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUTPUT_DIR="$PROJECT_ROOT/android/app"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -a|--alias)
            ALIAS="$2"
            shift 2
            ;;
        -f|--file)
            FILENAME="$2"
            shift 2
            ;;
        -v|--validity)
            VALIDITY="$2"
            shift 2
            ;;
        -d|--directory)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        -h|--help)
            sed -n '2,12p' "$0" | sed 's/^# //'
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

KEYSTORE_PATH="$OUTPUT_DIR/$FILENAME"

echo "=== OnePass Android Keystore Generator ==="
echo ""
echo "Configuration:"
echo "  Key alias: $ALIAS"
echo "  Keystore file: $KEYSTORE_PATH"
echo "  Validity: $VALIDITY days"
echo ""

if [[ -f "$KEYSTORE_PATH" ]]; then
    echo "Warning: Keystore file already exists at $KEYSTORE_PATH"
    read -p "Overwrite? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
    rm "$KEYSTORE_PATH"
fi

echo "Generating keystore..."
echo ""

keytool -genkeypair -v \
    -alias "$ALIAS" \
    -keyalg RSA \
    -keysize 2048 \
    -validity "$VALIDITY" \
    -keystore "$KEYSTORE_PATH"

echo ""
echo "=== Keystore created successfully! ==="
echo ""
echo "Next steps:"
echo "1. Copy the example configuration:"
echo "   cp android/keystore.properties.example android/keystore.properties"
echo ""
echo "2. Update android/keystore.properties with:"
echo "   storeFile=$FILENAME"
echo "   storePassword=<your-keystore-password>"
echo "   keyAlias=$ALIAS"
echo "   keyPassword=<your-key-password>"
echo ""
echo "3. Build a signed release APK:"
echo "   cd android && ./gradlew assembleRelease"
echo ""
echo "IMPORTANT: Keep your keystore and passwords secure!"
echo "           Never commit keystore.properties or keystore files to version control."
