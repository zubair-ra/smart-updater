import { ImpactTester } from '../core/tester.js';
import { PackageUpdater } from '../core/updater.js';
import { logger } from '../utils/logger.js';
import { RegistryAPI } from '../core/registry.js';
import chalk from 'chalk';

export async function testCommand(packageSpec?: string): Promise<void> {
  logger.header('🧪 Smart Updater - Impact Test');

  if (!packageSpec) {
    logger.error('Please specify a package to test (e.g., axios@1.6.0)');
    process.exit(1);
  }

  const [packageName, version] = packageSpec.split('@');

  if (!packageName || !version) {
    logger.error('Invalid package specification. Use format: package@version');
    process.exit(1);
  }

  logger.info(`Testing update: ${chalk.bold(packageName)} → ${chalk.cyan(version)}`);
  console.log();

  const tester = new ImpactTester();
  const updater = new PackageUpdater();

  try {
    // Get current version
    const currentVersion = await updater.getPackageVersion(packageName);

    if (!currentVersion) {
      logger.error(`Package ${packageName} is not installed in this project.`);
      process.exit(1);
    }

    logger.info(`Current version: ${updater.cleanVersion(currentVersion)}`);
    logger.info(`Test version: ${version}`);
    console.log();

    const spinner = logger.startSpinner('Running impact test...');

    const result = await tester.testInIsolation(async () => {
      await updater.updateSinglePackage(packageName, version);
      await updater.installDependencies();
    });

    logger.stopSpinner();

    // Display results
    logger.section('\nTest Results:');
    console.log();

    if (result.testsPass) {
      logger.success('✓ Tests: PASSED');
    } else {
      logger.error('✗ Tests: FAILED');
    }

    if (result.typeScriptPass) {
      logger.success('✓ TypeScript: PASSED');
    } else {
      logger.error('✗ TypeScript: FAILED');
    }

    if (result.duration) {
      logger.info(`Duration: ${(result.duration / 1000).toFixed(2)}s`);
    }

    if (result.errors && result.errors.length > 0) {
      logger.section('\nErrors:');
      result.errors.forEach(error => {
        logger.log(chalk.red(error));
      });
    }

    console.log();

    if (result.success) {
      logger.success('✓ Impact test passed! Update appears safe.');
      logger.info(`\nTo apply this update, run: smart-updater update`);
    } else {
      logger.error('✗ Impact test failed! Update may cause issues.');
      logger.warning('Review the errors above before proceeding.');
    }

  } catch (error: any) {
    logger.error(`Test failed: ${error.message}`);
    process.exit(1);
  }
}
