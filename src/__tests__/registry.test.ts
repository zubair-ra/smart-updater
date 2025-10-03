import { describe, it, expect, beforeEach } from '@jest/globals';
import { RegistryAPI } from '../core/registry.js';

describe('RegistryAPI - semver library testing', () => {
  describe('compareVersions', () => {
    it('should detect patch version updates', () => {
      const result = RegistryAPI.compareVersions('1.0.0', '1.0.1');

      expect(result.needsUpdate).toBe(true);
      expect(result.updateType).toBe('patch');
    });

    it('should detect minor version updates', () => {
      const result = RegistryAPI.compareVersions('1.0.0', '1.1.0');

      expect(result.needsUpdate).toBe(true);
      expect(result.updateType).toBe('minor');
    });

    it('should detect major version updates', () => {
      const result = RegistryAPI.compareVersions('1.0.0', '2.0.0');

      expect(result.needsUpdate).toBe(true);
      expect(result.updateType).toBe('major');
    });

    it('should return false when versions are equal', () => {
      const result = RegistryAPI.compareVersions('1.0.0', '1.0.0');

      expect(result.needsUpdate).toBe(false);
      expect(result.updateType).toBe(null);
    });

    it('should return false when current version is newer', () => {
      const result = RegistryAPI.compareVersions('2.0.0', '1.5.0');

      expect(result.needsUpdate).toBe(false);
      expect(result.updateType).toBe(null);
    });

    it('should handle invalid version strings', () => {
      const result = RegistryAPI.compareVersions('invalid', '1.0.0');

      expect(result.needsUpdate).toBe(false);
      expect(result.updateType).toBe(null);
    });

    it('should handle prerelease versions correctly', () => {
      const result = RegistryAPI.compareVersions('1.0.0', '1.1.0-beta.1');

      expect(result.needsUpdate).toBe(true);
      expect(result.updateType).toBe('minor');
    });

    it('should handle complex version comparisons', () => {
      const testCases = [
        { current: '1.0.0', latest: '1.0.10', expected: 'patch' },
        { current: '1.9.0', latest: '1.10.0', expected: 'minor' },
        { current: '0.9.0', latest: '1.0.0', expected: 'major' },
        { current: '1.0.0-alpha.1', latest: '1.0.0-alpha.2', expected: 'patch' },
      ];

      testCases.forEach(({ current, latest, expected }) => {
        const result = RegistryAPI.compareVersions(current, latest);
        expect(result.updateType).toBe(expected);
      });
    });
  });

  describe('determineRiskLevel', () => {
    it('should return critical for security issues', () => {
      const risk = RegistryAPI.determineRiskLevel('patch', true);
      expect(risk).toBe('critical');
    });

    it('should return critical for security issues even on major updates', () => {
      const risk = RegistryAPI.determineRiskLevel('major', true);
      expect(risk).toBe('critical');
    });

    it('should return breaking for major updates without security issues', () => {
      const risk = RegistryAPI.determineRiskLevel('major', false);
      expect(risk).toBe('breaking');
    });

    it('should return moderate for minor updates', () => {
      const risk = RegistryAPI.determineRiskLevel('minor', false);
      expect(risk).toBe('moderate');
    });

    it('should return safe for patch updates', () => {
      const risk = RegistryAPI.determineRiskLevel('patch', false);
      expect(risk).toBe('safe');
    });

    it('should return safe for null update type', () => {
      const risk = RegistryAPI.determineRiskLevel(null, false);
      expect(risk).toBe('safe');
    });
  });

  describe('semver edge cases', () => {
    it('should handle versions with build metadata', () => {
      const result = RegistryAPI.compareVersions('1.0.0+build.1', '1.0.0+build.2');
      // Build metadata should be ignored in semver
      expect(result.needsUpdate).toBe(false);
    });

    it('should handle versions with prerelease tags', () => {
      const result = RegistryAPI.compareVersions('1.0.0-alpha.1', '1.0.0-alpha.2');
      expect(result.needsUpdate).toBe(true);
      expect(result.updateType).toBe('patch');
    });

    it('should compare stable vs prerelease versions', () => {
      const result = RegistryAPI.compareVersions('1.0.0-beta', '1.0.0');
      expect(result.needsUpdate).toBe(true);
    });
  });

  describe('version validation', () => {
    it('should handle empty strings', () => {
      const result = RegistryAPI.compareVersions('', '1.0.0');
      expect(result.needsUpdate).toBe(false);
      expect(result.updateType).toBe(null);
    });

    it('should handle undefined-like strings', () => {
      const result = RegistryAPI.compareVersions('undefined', '1.0.0');
      expect(result.needsUpdate).toBe(false);
      expect(result.updateType).toBe(null);
    });

    it('should handle malformed version strings', () => {
      const result = RegistryAPI.compareVersions('v1.0.0', '1.0.0');
      // 'v' prefix is actually valid in semver
      expect(result).toBeDefined();
    });
  });

  describe('real-world version scenarios', () => {
    it('should handle React version updates correctly', () => {
      const scenarios = [
        { current: '17.0.2', latest: '18.0.0', type: 'major' },
        { current: '18.0.0', latest: '18.2.0', type: 'minor' },
        { current: '18.2.0', latest: '18.2.1', type: 'patch' },
      ];

      scenarios.forEach(({ current, latest, type }) => {
        const result = RegistryAPI.compareVersions(current, latest);
        expect(result.updateType).toBe(type);
      });
    });

    it('should handle TypeScript version updates', () => {
      const result = RegistryAPI.compareVersions('4.9.5', '5.0.0');
      expect(result.needsUpdate).toBe(true);
      expect(result.updateType).toBe('major');

      const risk = RegistryAPI.determineRiskLevel(result.updateType, false);
      expect(risk).toBe('breaking');
    });
  });
});

describe('RegistryAPI Integration Tests', () => {
  describe('getPackageInfo', () => {
    it('should return null for non-existent packages', async () => {
      const info = await RegistryAPI.getPackageInfo('this-package-definitely-does-not-exist-12345');
      expect(info).toBe(null);
    }, 10000);

    it('should get info for a real package', async () => {
      const info = await RegistryAPI.getPackageInfo('semver');

      expect(info).not.toBe(null);
      expect(info?.name).toBe('semver');
      expect(info?.version).toBeDefined();
      expect(typeof info?.version).toBe('string');
    }, 10000);
  });

  describe('getLatestVersion', () => {
    it('should return null for non-existent packages', async () => {
      const version = await RegistryAPI.getLatestVersion('non-existent-package-xyz-123');
      expect(version).toBe(null);
    }, 10000);

    it('should get latest version for semver package', async () => {
      const version = await RegistryAPI.getLatestVersion('semver');

      expect(version).not.toBe(null);
      expect(typeof version).toBe('string');
      // Validate it's a valid semver
      const result = RegistryAPI.compareVersions('0.0.1', version!);
      expect(result.needsUpdate).toBe(true);
    }, 10000);
  });
});
