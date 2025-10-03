import { readFile, writeFile, mkdir, copyFile, readdir, stat } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';

export class FileUtils {
  static async readJSON<T = any>(filePath: string): Promise<T | null> {
    try {
      const content = await readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  static async writeJSON(filePath: string, data: any, pretty = true): Promise<void> {
    const content = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    await writeFile(filePath, content + '\n', 'utf-8');
  }

  static exists(filePath: string): boolean {
    return existsSync(filePath);
  }

  static async ensureDir(dirPath: string): Promise<void> {
    if (!existsSync(dirPath)) {
      await mkdir(dirPath, { recursive: true });
    }
  }

  static async copy(source: string, destination: string): Promise<void> {
    await this.ensureDir(dirname(destination));
    await copyFile(source, destination);
  }

  static async readText(filePath: string): Promise<string | null> {
    try {
      return await readFile(filePath, 'utf-8');
    } catch (error) {
      return null;
    }
  }

  static async writeText(filePath: string, content: string): Promise<void> {
    await this.ensureDir(dirname(filePath));
    await writeFile(filePath, content, 'utf-8');
  }

  static async listFiles(dirPath: string): Promise<string[]> {
    try {
      return await readdir(dirPath);
    } catch (error) {
      return [];
    }
  }

  static async isDirectory(path: string): Promise<boolean> {
    try {
      const stats = await stat(path);
      return stats.isDirectory();
    } catch (error) {
      return false;
    }
  }

  static getSnapshotDir(): string {
    return join(process.cwd(), '.smart-updater', 'snapshots');
  }

  static getPackageJsonPath(): string {
    return join(process.cwd(), 'package.json');
  }

  static getPackageLockPath(): string {
    return join(process.cwd(), 'package-lock.json');
  }

  static getTsConfigPath(): string {
    return join(process.cwd(), 'tsconfig.json');
  }
}
