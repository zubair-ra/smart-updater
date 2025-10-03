import { FileUtils } from '../utils/files.js';
import type { Snapshot, SnapshotMetadata } from '../types/index.js';
import { join } from 'path';

export class SnapshotManager {
  private snapshotDir: string;

  constructor() {
    this.snapshotDir = FileUtils.getSnapshotDir();
  }

  async createSnapshot(packages: string[]): Promise<string> {
    const id = this.generateSnapshotId();
    const snapshotPath = join(this.snapshotDir, id);

    await FileUtils.ensureDir(snapshotPath);

    // Copy package.json
    const packageJsonPath = FileUtils.getPackageJsonPath();
    const packageJson = await FileUtils.readText(packageJsonPath);

    if (!packageJson) {
      throw new Error('Failed to read package.json');
    }

    await FileUtils.writeText(join(snapshotPath, 'package.json'), packageJson);

    // Copy package-lock.json if exists
    const packageLockPath = FileUtils.getPackageLockPath();
    if (FileUtils.exists(packageLockPath)) {
      const packageLock = await FileUtils.readText(packageLockPath);
      if (packageLock) {
        await FileUtils.writeText(join(snapshotPath, 'package-lock.json'), packageLock);
      }
    }

    // Save metadata
    const metadata: SnapshotMetadata = {
      id,
      timestamp: new Date().toISOString(),
      packages,
      success: true,
    };

    await FileUtils.writeJSON(join(snapshotPath, 'metadata.json'), metadata);

    return id;
  }

  async restoreSnapshot(id: string): Promise<boolean> {
    const snapshotPath = join(this.snapshotDir, id);

    if (!FileUtils.exists(snapshotPath)) {
      throw new Error(`Snapshot ${id} not found`);
    }

    // Restore package.json
    const packageJson = await FileUtils.readText(join(snapshotPath, 'package.json'));
    if (!packageJson) {
      throw new Error('Failed to read snapshot package.json');
    }

    await FileUtils.writeText(FileUtils.getPackageJsonPath(), packageJson);

    // Restore package-lock.json if exists
    const packageLockSnapshot = join(snapshotPath, 'package-lock.json');
    if (FileUtils.exists(packageLockSnapshot)) {
      const packageLock = await FileUtils.readText(packageLockSnapshot);
      if (packageLock) {
        await FileUtils.writeText(FileUtils.getPackageLockPath(), packageLock);
      }
    }

    return true;
  }

  async listSnapshots(): Promise<SnapshotMetadata[]> {
    if (!FileUtils.exists(this.snapshotDir)) {
      return [];
    }

    const snapshots: SnapshotMetadata[] = [];
    const files = await FileUtils.listFiles(this.snapshotDir);

    for (const file of files) {
      const metadataPath = join(this.snapshotDir, file, 'metadata.json');
      const metadata = await FileUtils.readJSON<SnapshotMetadata>(metadataPath);

      if (metadata) {
        snapshots.push(metadata);
      }
    }

    // Sort by timestamp (newest first)
    return snapshots.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async deleteSnapshot(id: string): Promise<void> {
    const snapshotPath = join(this.snapshotDir, id);
    if (FileUtils.exists(snapshotPath)) {
      // Note: Would need to implement recursive delete or use a library
      // For now, this is a placeholder
    }
  }

  private generateSnapshotId(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `snapshot-${timestamp}`;
  }

  async getSnapshot(id: string): Promise<SnapshotMetadata | null> {
    const metadataPath = join(this.snapshotDir, id, 'metadata.json');
    return await FileUtils.readJSON<SnapshotMetadata>(metadataPath);
  }
}
