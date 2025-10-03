import { execa } from 'execa';

export class NPMUtils {
  static async install(): Promise<{ success: boolean; output: string }> {
    try {
      const { stdout, stderr } = await execa('npm', ['install'], {
        cwd: process.cwd(),
      });
      return { success: true, output: stdout || stderr };
    } catch (error: any) {
      return { success: false, output: error.message };
    }
  }

  static async runTests(): Promise<{ success: boolean; output: string }> {
    try {
      const { stdout, stderr } = await execa('npm', ['test'], {
        cwd: process.cwd(),
        reject: false,
      });
      return { success: true, output: stdout || stderr };
    } catch (error: any) {
      return { success: false, output: error.message };
    }
  }

  static async audit(): Promise<{ success: boolean; vulnerabilities: any }> {
    try {
      const { stdout } = await execa('npm', ['audit', '--json'], {
        cwd: process.cwd(),
        reject: false,
      });
      const result = JSON.parse(stdout);
      return { success: true, vulnerabilities: result };
    } catch (error: any) {
      return { success: false, vulnerabilities: {} };
    }
  }

  static async checkTypeScript(): Promise<{ success: boolean; output: string }> {
    try {
      const { stdout, stderr } = await execa('npx', ['tsc', '--noEmit'], {
        cwd: process.cwd(),
        reject: false,
      });
      return { success: true, output: stdout || stderr };
    } catch (error: any) {
      return { success: false, output: error.message };
    }
  }

  static async getPackageInfo(packageName: string): Promise<any> {
    try {
      const { stdout } = await execa('npm', ['view', packageName, '--json'], {
        cwd: process.cwd(),
      });
      return JSON.parse(stdout);
    } catch (error) {
      return null;
    }
  }
}
