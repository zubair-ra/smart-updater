import inquirer from 'inquirer';
import { PackageAnalyzer } from '../core/analyzer.js';
import { PackageUpdater } from '../core/updater.js';
import { SnapshotManager } from '../core/snapshot.js';
import { NPMUtils } from '../utils/npm.js';
import { logger } from '../utils/logger.js';
import type { UpdateOptions, PackageUpdate } from '../types/index.js';
import chalk from 'chalk';

export async function updateCommand(options: UpdateOptions): Promise<void> {
  logger.header('📦 Smart Updater - Update Packages');

  const spinner = logger.startSpinner('Analyzing packages...');
  const analyzer = new PackageAnalyzer();
  const updater = new PackageUpdater();
  const snapshotManager = new SnapshotManager();

  try {
    let updates = await analyzer.analyzeUpdates(options.security);
    logger.succeedSpinner('Analysis complete!');

    if (updates.length === 0) {
      logger.success('All packages are up to date! 🎉');
      return;
    }

    // Filter based on options
    if (options.safe) {
      updates = updates.filter(u => u.type === 'patch');
    }

    if (options.security) {
      updates = updates.filter(u => u.hasSecurityIssue);
    }

    if (updates.length === 0) {
      logger.info('No packages match the selected criteria.');
      return;
    }

    let selectedUpdates: PackageUpdate[] = [];

    // Interactive mode or auto mode
    if (options.interactive || (!options.all && !options.safe && !options.security)) {
      const choices = updates.map(update => {
        const riskIcon = {
          critical: '🚨',
          breaking: '⚠️ ',
          moderate: '📝',
          safe: '✓',
        }[update.riskLevel];

        return {
          name: `${riskIcon} ${update.name}: ${chalk.dim(update.currentVersion)} → ${chalk.green(update.latestVersion)} ${chalk.dim('[' + update.type + ']')}`,
          value: update,
          checked: update.hasSecurityIssue || update.type === 'patch',
        };
      });

      const answers = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'packages',
          message: 'Select packages to update:',
          choices,
          pageSize: 15,
        },
      ]);

      selectedUpdates = answers.packages;
    } else {
      selectedUpdates = updates;
    }

    if (selectedUpdates.length === 0) {
      logger.info('No packages selected for update.');
      return;
    }

    // Show summary
    logger.section(`\nUpdating ${selectedUpdates.length} package(s):`);
    selectedUpdates.forEach(update => {
      logger.log(`  • ${chalk.bold(update.name)}: ${update.currentVersion} → ${chalk.green(update.latestVersion)}`);
    });

    // Confirm
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Proceed with updates?',
        default: true,
      },
    ]);

    if (!confirm) {
      logger.info('Update cancelled.');
      return;
    }

    // Create snapshot before updating
    const snapshotSpinner = logger.startSpinner('Creating snapshot...');
    const snapshotId = await snapshotManager.createSnapshot(
      selectedUpdates.map(u => u.name)
    );
    logger.succeedSpinner(`Snapshot created: ${snapshotId}`);

    // Update package.json
    const updateSpinner = logger.startSpinner('Updating package.json...');
    const versions: Record<string, string> = {};
    selectedUpdates.forEach(update => {
      versions[update.name] = update.latestVersion;
    });

    await updater.updatePackages(
      selectedUpdates.map(u => u.name),
      versions
    );
    logger.succeedSpinner('package.json updated');

    // Install dependencies
    const installSpinner = logger.startSpinner('Installing dependencies...');
    const installResult = await updater.installDependencies();

    if (!installResult.success) {
      logger.failSpinner('Installation failed');
      logger.error('Rolling back to previous state...');

      await snapshotManager.restoreSnapshot(snapshotId);
      await NPMUtils.install();

      logger.error('Update failed. Rolled back to previous state.');
      process.exit(1);
    }

    logger.succeedSpinner('Dependencies installed successfully!');

    logger.success(`\n✓ Successfully updated ${selectedUpdates.length} package(s)!`);
    logger.info(`\nSnapshot saved: ${snapshotId}`);
    logger.info(`Run 'smart-updater rollback' to restore if needed.`);

  } catch (error: any) {
    logger.failSpinner('Update failed');
    logger.error(error.message);
    process.exit(1);
  }
}
