# Android Code Signing

This document explains how to set up code signing for Android release builds.

## Overview

OnePass uses Gradle's signing configuration to sign Android release APKs. The signing configuration is externalized to a `keystore.properties` file that should **never** be committed to version control.

## Quick Setup

1. Copy the example configuration:

   ```bash
   cd packages/mobile/android
   cp keystore.properties.example keystore.properties
   ```

2. Generate a release keystore (if you don't have one):

   ```bash
   keytool -genkeypair -v \
     -alias onepass \
     -keyalg RSA \
     -keysize 2048 \
     -validity 10000 \
     -keystore app/release.keystore
   ```

3. Update `keystore.properties` with your keystore details:

   ```properties
   storeFile=release.keystore
   storePassword=YOUR_STORE_PASSWORD
   keyAlias=onepass
   keyPassword=YOUR_KEY_PASSWORD
   ```

4. Build a signed release APK:
   ```bash
   cd packages/mobile/android
   ./gradlew assembleRelease
   ```

The signed APK will be at `app/build/outputs/apk/release/app-release.apk`.

## Keystore Security

**Critical security practices:**

- Never commit `keystore.properties` to version control
- Never commit keystore files (`.keystore`, `.jks`) to version control
- Use strong, unique passwords for the keystore and key
- Store keystore and passwords in a secure password manager
- Create backups of your keystore in a secure location

## CI/CD Setup

For CI/CD pipelines, store keystore and credentials as secure environment variables or secrets:

### GitHub Actions

```yaml
env:
  KEYSTORE_BASE64: ${{ secrets.KEYSTORE_BASE64 }}
  KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
  KEY_ALIAS: onepass
  KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}

steps:
  - name: Setup keystore
    run: |
      echo $KEYSTORE_BASE64 | base64 -d > packages/mobile/android/app/release.keystore
      echo "storeFile=release.keystore" > packages/mobile/android/keystore.properties
      echo "storePassword=$KEYSTORE_PASSWORD" >> packages/mobile/android/keystore.properties
      echo "keyAlias=$KEY_ALIAS" >> packages/mobile/android/keystore.properties
      echo "keyPassword=$KEY_PASSWORD" >> packages/mobile/android/keystore.properties
```

### Environment Variables

| Variable            | Description                         |
| ------------------- | ----------------------------------- |
| `KEYSTORE_BASE64`   | Base64-encoded keystore file        |
| `KEYSTORE_PASSWORD` | Password for the keystore           |
| `KEY_ALIAS`         | Alias of the key to use for signing |
| `KEY_PASSWORD`      | Password for the key                |

## Debug vs Release Signing

- **Debug builds** are automatically signed with a debug keystore located at `app/debug.keystore`. This is suitable for development and testing.
- **Release builds** require your production keystore. If `keystore.properties` is not configured, release builds will fall back to debug signing (not suitable for Play Store distribution).

## Troubleshooting

### "Keystore file not found"

Ensure the path in `keystore.properties` is relative to `packages/mobile/android/`:

```properties
storeFile=app/release.keystore  # Correct
storeFile=/absolute/path/to/release.keystore  # Also works
```

### "Keystore was tampered with, or password was incorrect"

Verify your passwords in `keystore.properties` match the passwords used when creating the keystore.

### Build fails with signing errors

1. Verify `keystore.properties` exists in `packages/mobile/android/`
2. Verify the keystore file exists at the specified path
3. Verify passwords are correct
4. Try rebuilding with `./gradlew clean assembleRelease`
