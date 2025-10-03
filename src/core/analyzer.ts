import { FileUtils } from '../utils/files.js';
import { RegistryAPI } from './registry.js';
import { NPMUtils } from '../utils/npm.js';
import type { PackageUpdate, DependencyType } from '../types/index.js';

export class PackageAnalyzer {
  private vulnerablePackages: Set<string> = new Set();

  async analyzeUpdates(securityOnly = false): Promise<PackageUpdate[]> {
    const packageJson = await FileUtils.readJSON(FileUtils.getPackageJsonPath());

    if (!packageJson) {
      throw new Error('package.json not found');
    }

    // Get security vulnerabilities
    await this.loadVulnerabilities();

    const updates: PackageUpdate[] = [];
    const depTypes: DependencyType[] = [
      'dependencies',
      'devDependencies',
      'peerDependencies',
      'optionalDependencies',
    ];

    for (const depType of depTypes) {
      const deps = packageJson[depType];
      if (!deps) continue;

      for (const [name, versionRange] of Object.entries(deps)) {
        const currentVersion = this.cleanVersion(versionRange as string);
        const latestVersion = await RegistryAPI.getLatestVersion(name);

        if (!latestVersion || !currentVersion) continue;

        const { needsUpdate, updateType } = RegistryAPI.compareVersions(
          currentVersion,
          latestVersion
        );

        if (!needsUpdate) continue;

        const hasSecurityIssue = this.vulnerablePackages.has(name);

        // Skip non-security updates if securityOnly is true
        if (securityOnly && !hasSecurityIssue) continue;

        const riskLevel = RegistryAPI.determineRiskLevel(updateType, hasSecurityIssue);

        updates.push({
          name,
          currentVersion,
          latestVersion,
          type: updateType || 'patch',
          riskLevel,
          hasSecurityIssue,
          dependencyType: depType,
        });
      }
    }

    return this.sortByRisk(updates);
  }

  private async loadVulnerabilities(): Promise<void> {
    const auditResult = await NPMUtils.audit();

    if (auditResult.success && auditResult.vulnerabilities) {
      const vulns = auditResult.vulnerabilities.vulnerabilities || {};

      for (const pkgName of Object.keys(vulns)) {
        this.vulnerablePackages.add(pkgName);
      }
    }
  }

  private cleanVersion(versionRange: string): string {
    // Remove ^, ~, >, <, =, >=, <= and get the actual version
    return versionRange.replace(/^[\^~><>=]+/, '');
  }

  private sortByRisk(updates: PackageUpdate[]): PackageUpdate[] {
    const riskOrder = { critical: 0, breaking: 1, moderate: 2, safe: 3 };

    return updates.sort((a, b) => {
      const riskDiff = riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
      if (riskDiff !== 0) return riskDiff;

      return a.name.localeCompare(b.name);
    });
  }

  async getPackageDetails(packageName: string): Promise<any> {
    return await RegistryAPI.getPackageInfo(packageName);
  }
}
