import { execa } from 'execa';

export class GitUtils {
  static async isGitRepo(): Promise<boolean> {
    try {
      await execa('git', ['rev-parse', '--git-dir'], {
        cwd: process.cwd(),
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  static async getCurrentBranch(): Promise<string | null> {
    try {
      const { stdout } = await execa('git', ['branch', '--show-current'], {
        cwd: process.cwd(),
      });
      return stdout.trim();
    } catch (error) {
      return null;
    }
  }

  static async createBranch(branchName: string): Promise<boolean> {
    try {
      await execa('git', ['checkout', '-b', branchName], {
        cwd: process.cwd(),
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  static async switchBranch(branchName: string): Promise<boolean> {
    try {
      await execa('git', ['checkout', branchName], {
        cwd: process.cwd(),
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  static async deleteBranch(branchName: string, force = false): Promise<boolean> {
    try {
      const flag = force ? '-D' : '-d';
      await execa('git', ['branch', flag, branchName], {
        cwd: process.cwd(),
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  static async hasUncommittedChanges(): Promise<boolean> {
    try {
      const { stdout } = await execa('git', ['status', '--porcelain'], {
        cwd: process.cwd(),
      });
      return stdout.trim().length > 0;
    } catch (error) {
      return false;
    }
  }

  static async commit(message: string): Promise<boolean> {
    try {
      await execa('git', ['add', '.'], { cwd: process.cwd() });
      await execa('git', ['commit', '-m', message], {
        cwd: process.cwd(),
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}
