import inquirer from 'inquirer';
import { SnapshotManager } from '../core/snapshot.js';
import { NPMUtils } from '../utils/npm.js';
import { logger } from '../utils/logger.js';
import chalk from 'chalk';

export async function rollbackCommand(): Promise<void> {
  logger.header('⏮️  Smart Updater - Rollback');

  const snapshotManager = new SnapshotManager();

  try {
    const snapshots = await snapshotManager.listSnapshots();

    if (snapshots.length === 0) {
      logger.info('No snapshots available for rollback.');
      logger.info('Snapshots are created automatically when you update packages.');
      return;
    }

    logger.section(`Found ${snapshots.length} snapshot(s):`);
    console.log();

    const choices = snapshots.map(snapshot => {
      const date = new Date(snapshot.timestamp);
      const formatted = date.toLocaleString();
      const packages = snapshot.packages.join(', ');

      return {
        name: `${chalk.bold(snapshot.id)} - ${chalk.dim(formatted)}\n  Packages: ${chalk.cyan(packages)}`,
        value: snapshot.id,
        short: snapshot.id,
      };
    });

    const { selectedSnapshot } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedSnapshot',
        message: 'Select a snapshot to rollback to:',
        choices,
        pageSize: 10,
      },
    ]);

    const snapshot = await snapshotManager.getSnapshot(selectedSnapshot);

    if (!snapshot) {
      logger.error('Snapshot not found.');
      return;
    }

    logger.section('\nSnapshot details:');
    logger.log(`  ID: ${chalk.bold(snapshot.id)}`);
    logger.log(`  Date: ${new Date(snapshot.timestamp).toLocaleString()}`);
    logger.log(`  Packages: ${snapshot.packages.join(', ')}`);

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: chalk.yellow('This will replace your current package.json. Continue?'),
        default: false,
      },
    ]);

    if (!confirm) {
      logger.info('Rollback cancelled.');
      return;
    }

    const restoreSpinner = logger.startSpinner('Restoring snapshot...');
    await snapshotManager.restoreSnapshot(selectedSnapshot);
    logger.succeedSpinner('Snapshot restored');

    const installSpinner = logger.startSpinner('Installing dependencies...');
    const installResult = await NPMUtils.install();

    if (!installResult.success) {
      logger.failSpinner('Installation failed');
      logger.error(installResult.output);
      process.exit(1);
    }

    logger.succeedSpinner('Dependencies installed successfully!');

    logger.success('\n✓ Rollback completed successfully!');
    logger.info('Your packages have been restored to the snapshot state.');

  } catch (error: any) {
    logger.error(`Rollback failed: ${error.message}`);
    process.exit(1);
  }
}
