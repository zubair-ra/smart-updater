import { NPMUtils } from '../utils/npm.js';
import { FileUtils } from '../utils/files.js';
import { GitUtils } from '../utils/git.js';
import type { TestResult } from '../types/index.js';

export class ImpactTester {
  async runTests(): Promise<TestResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    // Check if TypeScript project
    const hasTsConfig = FileUtils.exists(FileUtils.getTsConfigPath());

    // Run npm test
    const testResult = await NPMUtils.runTests();
    const testsPass = testResult.success && !testResult.output.toLowerCase().includes('failed');

    if (!testsPass && testResult.output) {
      errors.push(testResult.output);
    }

    // Run TypeScript check if applicable
    let typeScriptPass = true;
    if (hasTsConfig) {
      const tsResult = await NPMUtils.checkTypeScript();
      typeScriptPass = tsResult.success && !tsResult.output.toLowerCase().includes('error');

      if (!typeScriptPass && tsResult.output) {
        errors.push(tsResult.output);
      }
    }

    const duration = Date.now() - startTime;

    const result: TestResult = {
      success: testsPass && typeScriptPass,
      testsPass,
      typeScriptPass,
      duration,
    };

    if (errors.length > 0) {
      result.errors = errors;
    }

    return result;
  }

  async testInIsolation(updateFn: () => Promise<void>): Promise<TestResult> {
    const isGit = await GitUtils.isGitRepo();

    if (!isGit) {
      // If not a git repo, just run the update and test
      await updateFn();
      return await this.runTests();
    }

    // Create a test branch
    const originalBranch = await GitUtils.getCurrentBranch();
    const testBranch = `smart-updater-test-${Date.now()}`;

    try {
      // Check for uncommitted changes
      const hasChanges = await GitUtils.hasUncommittedChanges();
      if (hasChanges) {
        throw new Error('You have uncommitted changes. Please commit or stash them first.');
      }

      // Create test branch
      await GitUtils.createBranch(testBranch);

      // Run the update
      await updateFn();

      // Run tests
      const result = await this.runTests();

      // Switch back to original branch
      if (originalBranch) {
        await GitUtils.switchBranch(originalBranch);
      }

      // Delete test branch
      await GitUtils.deleteBranch(testBranch, true);

      return result;

    } catch (error: any) {
      // Try to switch back and clean up
      if (originalBranch) {
        await GitUtils.switchBranch(originalBranch);
      }
      await GitUtils.deleteBranch(testBranch, true);

      throw error;
    }
  }
}
