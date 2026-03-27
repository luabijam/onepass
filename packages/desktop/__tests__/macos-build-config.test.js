const fs = require('fs');
const path = require('path');

const macosDir = path.join(__dirname, '..', 'macos');
const pbxprojPath = path.join(macosDir, 'desktop.xcodeproj', 'project.pbxproj');
const infoPlistPath = path.join(macosDir, 'desktop-macOS', 'Info.plist');
const entitlementsPath = path.join(macosDir, 'desktop-macOS', 'desktop.entitlements');
const appJsonPath = path.join(__dirname, '..', 'app.json');

describe('macOS Build Configuration', () => {
  describe('project.pbxproj', () => {
    let pbxprojContent;

    beforeAll(() => {
      pbxprojContent = fs.readFileSync(pbxprojPath, 'utf8');
    });

    it('should have correct bundle identifier for release build', () => {
      expect(pbxprojContent).toContain('PRODUCT_BUNDLE_IDENTIFIER = com.onepass.desktop');
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

    it('should have correct deployment target', () => {
      expect(pbxprojContent).toContain('MACOSX_DEPLOYMENT_TARGET = 11.0');
    });

    it('should have automatic code signing style', () => {
      expect(pbxprojContent).toContain('CODE_SIGN_STYLE = Automatic');
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
      expect(entitlementsContent).toContain('com.apple.security.network.client');
    });

    it('should have network server capability for sync', () => {
      expect(entitlementsContent).toContain('com.apple.security.network.server');
    });

    it('should have file read access', () => {
      expect(entitlementsContent).toContain('com.apple.security.files.user-selected.read-only');
    });

    it('should have file write access for import/export', () => {
      expect(entitlementsContent).toContain('com.apple.security.files.user-selected.read-write');
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
});
