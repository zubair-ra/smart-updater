#!/usr/bin/env node

import { Command } from 'commander';
import { analyzeCommand } from '../commands/analyze.js';
import { updateCommand } from '../commands/update.js';
import { testCommand } from '../commands/test.js';
import { rollbackCommand } from '../commands/rollback.js';
import { whyCommand } from '../commands/why.js';
import { logger } from '../utils/logger.js';

const program = new Command();

program
  .name('smart-updater')
  .description('Intelligent npm package updater with safety checks and rollback')
  .version('1.0.0');

// Analyze command
program
  .command('analyze')
  .alias('a')
  .description('Analyze outdated packages and check for updates')
  .option('-s, --security', 'Show only security updates')
  .option('-v, --verbose', 'Show detailed information')
  .action(async (options) => {
    try {
      await analyzeCommand(options);
    } catch (error: any) {
      logger.error(error.message);
      process.exit(1);
    }
  });

// Update command
program
  .command('update')
  .alias('u')
  .description('Update packages with safety checks')
  .option('-i, --interactive', 'Select packages interactively')
  .option('-s, --security', 'Update only security fixes')
  .option('--safe', 'Update only patch versions')
  .option('--all', 'Update all packages (with confirmation)')
  .option('--skip-tests', 'Skip running tests')
  .action(async (options) => {
    try {
      await updateCommand(options);
    } catch (error: any) {
      logger.error(error.message);
      process.exit(1);
    }
  });

// Test command
program
  .command('test [package]')
  .alias('t')
  .description('Test impact of updating a specific package (e.g., axios@1.6.0)')
  .action(async (packageSpec) => {
    try {
      await testCommand(packageSpec);
    } catch (error: any) {
      logger.error(error.message);
      process.exit(1);
    }
  });

// Rollback command
program
  .command('rollback')
  .alias('r')
  .description('Rollback to a previous package state')
  .action(async () => {
    try {
      await rollbackCommand();
    } catch (error: any) {
      logger.error(error.message);
      process.exit(1);
    }
  });

// Why command
program
  .command('why <package>')
  .alias('w')
  .description('Show information about a package and why it\'s installed')
  .action(async (packageName) => {
    try {
      await whyCommand(packageName);
    } catch (error: any) {
      logger.error(error.message);
      process.exit(1);
    }
  });

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
