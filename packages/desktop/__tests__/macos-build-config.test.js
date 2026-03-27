const fs = require('fs');
const path = require('path');

const macosDir = path.join(__dirname, '..', 'macos');
const pbxprojPath = path.join(macosDir, 'desktop.xcodeproj', 'project.pbxproj');
const infoPlistPath = path.join(macosDir, 'desktop-macOS', 'Info.plist');
const entitlementsPath = path.join(
  macosDir,
  'desktop-macOS',
  'desktop.entitlements',
);
const releaseEntitlementsPath = path.join(
  macosDir,
  'desktop-macOS',
  'desktop-release.entitlements',
);
const appJsonPath = path.join(__dirname, '..', 'app.json');
const scriptsDir = path.join(__dirname, '..', '..', '..', 'scripts');

describe('macOS Build Configuration', () => {
  describe('project.pbxproj', () => {
    let pbxprojContent;

    beforeAll(() => {
      pbxprojContent = fs.readFileSync(pbxprojPath, 'utf8');
    });

    it('should have correct bundle identifier for release build', () => {
      expect(pbxprojContent).toContain(
        'PRODUCT_BUNDLE_IDENTIFIER = com.onepass.desktop',
      );
    });

    it('should have correct product name', () => {
      expect(pbxprojContent).toContain('PRODUCT_NAME = OnePass');
    });

    it('should have correct marketing version', () => {
      expect(pbxprojContent).toContain('MARKETING_VERSION = 0.1.0');
    });

    it('should reference entitlements file', () => {
      expect(pbxprojContent).toContain('CODE_SIGN_ENTITLEMENTS');
      expect(pbxprojContent).toContain('desktop-macOS/desktop.entitlements');
    });

    it('should reference release entitlements file for release builds', () => {
      expect(pbxprojContent).toContain(
        'desktop-macOS/desktop-release.entitlements',
      );
    });

    it('should have correct deployment target', () => {
      expect(pbxprojContent).toContain('MACOSX_DEPLOYMENT_TARGET = 11.0');
    });

    it('should have automatic code signing style', () => {
      expect(pbxprojContent).toContain('CODE_SIGN_STYLE = Automatic');
    });

    it('should have Developer ID Application signing identity for release', () => {
      expect(pbxprojContent).toContain(
        'CODE_SIGN_IDENTITY = "Developer ID Application"',
      );
    });

    it('should have hardened runtime enabled for release', () => {
      expect(pbxprojContent).toContain('ENABLE_HARDENED_RUNTIME = YES');
    });
  });

  describe('Info.plist', () => {
    let infoPlistContent;

    beforeAll(() => {
      infoPlistContent = fs.readFileSync(infoPlistPath, 'utf8');
    });

    it('should use MARKETING_VERSION variable for short version', () => {
      expect(infoPlistContent).toContain('$(MARKETING_VERSION)');
    });

    it('should use CURRENT_PROJECT_VERSION variable for build number', () => {
      expect(infoPlistContent).toContain('$(CURRENT_PROJECT_VERSION)');
    });

    it('should have copyright notice', () => {
      expect(infoPlistContent).toContain('NSHumanReadableCopyright');
      expect(infoPlistContent).toContain('OnePass');
    });

    it('should have app category', () => {
      expect(infoPlistContent).toContain('LSApplicationCategoryType');
    });

    it('should allow localhost network connections', () => {
      expect(infoPlistContent).toContain('NSAppTransportSecurity');
      expect(infoPlistContent).toContain('localhost');
    });
  });

  describe('entitlements', () => {
    let entitlementsContent;

    beforeAll(() => {
      entitlementsContent = fs.readFileSync(entitlementsPath, 'utf8');
    });

    it('should have app sandbox enabled', () => {
      expect(entitlementsContent).toContain('com.apple.security.app-sandbox');
      expect(entitlementsContent).toContain('<true/>');
    });

    it('should have network client capability', () => {
      expect(entitlementsContent).toContain(
        'com.apple.security.network.client',
      );
    });

    it('should have network server capability for sync', () => {
      expect(entitlementsContent).toContain(
        'com.apple.security.network.server',
      );
    });

    it('should have file read access', () => {
      expect(entitlementsContent).toContain(
        'com.apple.security.files.user-selected.read-only',
      );
    });

    it('should have file write access for import/export', () => {
      expect(entitlementsContent).toContain(
        'com.apple.security.files.user-selected.read-write',
      );
    });

    it('should have hardened runtime exception for unsigned executable memory (JSCore)', () => {
      expect(entitlementsContent).toContain(
        'com.apple.security.cs.allow-unsigned-executable-memory',
      );
    });

    it('should have hardened runtime exception for library validation', () => {
      expect(entitlementsContent).toContain(
        'com.apple.security.cs.disable-library-validation',
      );
    });

    it('should have JIT exception for JavaScript engine', () => {
      expect(entitlementsContent).toContain('com.apple.security.cs.allow-jit');
    });
  });

  describe('release entitlements', () => {
    let releaseEntitlementsContent;

    beforeAll(() => {
      releaseEntitlementsContent = fs.readFileSync(
        releaseEntitlementsPath,
        'utf8',
      );
    });

    it('should exist', () => {
      expect(fs.existsSync(releaseEntitlementsPath)).toBe(true);
    });

    it('should have all the required entitlements for hardened runtime', () => {
      expect(releaseEntitlementsContent).toContain(
        'com.apple.security.app-sandbox',
      );
      expect(releaseEntitlementsContent).toContain(
        'com.apple.security.network.client',
      );
      expect(releaseEntitlementsContent).toContain(
        'com.apple.security.network.server',
      );
      expect(releaseEntitlementsContent).toContain(
        'com.apple.security.cs.allow-unsigned-executable-memory',
      );
      expect(releaseEntitlementsContent).toContain(
        'com.apple.security.cs.disable-library-validation',
      );
      expect(releaseEntitlementsContent).toContain(
        'com.apple.security.cs.allow-jit',
      );
    });
  });

  describe('app.json', () => {
    let appJson;

    beforeAll(() => {
      appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    });

    it('should have correct app name', () => {
      expect(appJson.name).toBe('onepass-desktop');
    });

    it('should have correct display name', () => {
      expect(appJson.displayName).toBe('OnePass');
    });
  });

  describe('code signing scripts', () => {
    it('should have notarize script', () => {
      expect(fs.existsSync(path.join(scriptsDir, 'notarize.sh'))).toBe(true);
    });

    it('should have build-signed script', () => {
      expect(fs.existsSync(path.join(scriptsDir, 'build-signed.sh'))).toBe(
        true,
      );
    });

    it('notarize script should be executable', () => {
      const stats = fs.statSync(path.join(scriptsDir, 'notarize.sh'));
      expect(Boolean(stats.mode & 0o111)).toBe(true);
    });

    it('build-signed script should be executable', () => {
      const stats = fs.statSync(path.join(scriptsDir, 'build-signed.sh'));
      expect(Boolean(stats.mode & 0o111)).toBe(true);
    });

    it('notarize script should check for required environment variables', () => {
      const script = fs.readFileSync(
        path.join(scriptsDir, 'notarize.sh'),
        'utf8',
      );
      expect(script).toContain('APPLE_ID');
      expect(script).toContain('TEAM_ID');
      expect(script).toContain('APP_PASSWORD');
    });

    it('build-signed script should accept team id parameter', () => {
      const script = fs.readFileSync(
        path.join(scriptsDir, 'build-signed.sh'),
        'utf8',
      );
      expect(script).toContain('--team');
      expect(script).toContain('DEVELOPMENT_TEAM');
    });
  });
});
