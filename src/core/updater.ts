import { FileUtils } from '../utils/files.js';
import { NPMUtils } from '../utils/npm.js';
import type { UpdateOptions } from '../types/index.js';
import semver from 'semver';

export class PackageUpdater {
  async updatePackages(packages: string[], versions: Record<string, string>): Promise<boolean> {
    const packageJsonPath = FileUtils.getPackageJsonPath();
    const packageJson = await FileUtils.readJSON(packageJsonPath);

    if (!packageJson) {
      throw new Error('package.json not found');
    }

    // Update versions in package.json
    for (const pkg of packages) {
      const newVersion = versions[pkg];
      if (!newVersion) continue;

      // Check in all dependency types
      const depTypes = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];

      for (const depType of depTypes) {
        if (packageJson[depType] && packageJson[depType][pkg]) {
          // Preserve the prefix (^, ~, etc.)
          const currentVersion = packageJson[depType][pkg];
          const prefix = this.getVersionPrefix(currentVersion);
          packageJson[depType][pkg] = `${prefix}${newVersion}`;
        }
      }
    }

    // Write updated package.json
    await FileUtils.writeJSON(packageJsonPath, packageJson);

    return true;
  }

  async installDependencies(): Promise<{ success: boolean; output: string }> {
    return await NPMUtils.install();
  }

  private getVersionPrefix(version: string): string {
    const match = version.match(/^([\^~><>=]*)/);
    return match ? match[1]! : '';
  }

  async updateSinglePackage(packageName: string, version: string): Promise<boolean> {
    return this.updatePackages([packageName], { [packageName]: version });
  }

  async getPackageVersion(packageName: string): Promise<string | null> {
    const packageJson = await FileUtils.readJSON(FileUtils.getPackageJsonPath());
    if (!packageJson) return null;

    const depTypes = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];

    for (const depType of depTypes) {
      if (packageJson[depType] && packageJson[depType][packageName]) {
        return packageJson[depType][packageName];
      }
    }

    return null;
  }

  cleanVersion(versionRange: string): string {
    return versionRange.replace(/^[\^~><>=]+/, '');
  }
}
