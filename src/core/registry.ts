import pacote from 'pacote';
import semver from 'semver';
import type { PackageInfo } from '../types/index.js';

export class RegistryAPI {
  static async getPackageInfo(packageName: string): Promise<PackageInfo | null> {
    try {
      const manifest = await pacote.manifest(packageName) as any;

      return {
        name: manifest.name,
        version: manifest.version,
        description: manifest.description,
        repository: manifest.repository,
        homepage: manifest.homepage,
        deprecated: manifest.deprecated,
      };
    } catch (error) {
      return null;
    }
  }

  static async getLatestVersion(packageName: string): Promise<string | null> {
    try {
      const manifest = await pacote.manifest(`${packageName}@latest`);
      return manifest.version;
    } catch (error) {
      return null;
    }
  }

  static async getAllVersions(packageName: string): Promise<string[]> {
    try {
      const packument = await pacote.packument(packageName);
      return Object.keys(packument.versions || {});
    } catch (error) {
      return [];
    }
  }

  static compareVersions(current: string, latest: string): {
    needsUpdate: boolean;
    updateType: 'major' | 'minor' | 'patch' | null;
  } {
    if (!semver.valid(current) || !semver.valid(latest)) {
      return { needsUpdate: false, updateType: null };
    }

    if (semver.gte(current, latest)) {
      return { needsUpdate: false, updateType: null };
    }

    const diff = semver.diff(current, latest);

    if (diff === 'major' || diff === 'premajor') {
      return { needsUpdate: true, updateType: 'major' };
    } else if (diff === 'minor' || diff === 'preminor') {
      return { needsUpdate: true, updateType: 'minor' };
    } else {
      return { needsUpdate: true, updateType: 'patch' };
    }
  }

  static determineRiskLevel(updateType: 'major' | 'minor' | 'patch' | null, hasSecurityIssue: boolean): 'critical' | 'breaking' | 'moderate' | 'safe' {
    if (hasSecurityIssue) {
      return 'critical';
    }

    switch (updateType) {
      case 'major':
        return 'breaking';
      case 'minor':
        return 'moderate';
      case 'patch':
        return 'safe';
      default:
        return 'safe';
    }
  }

  static async isPackageDeprecated(packageName: string, version?: string): Promise<boolean> {
    try {
      const target = version ? `${packageName}@${version}` : packageName;
      const manifest = await pacote.manifest(target);
      return !!manifest.deprecated;
    } catch (error) {
      return false;
    }
  }
}
