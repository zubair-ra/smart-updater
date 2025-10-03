import { FileUtils } from '../utils/files.js';
import { RegistryAPI } from '../core/registry.js';
import { logger } from '../utils/logger.js';
import { execa } from 'execa';
import chalk from 'chalk';

export async function whyCommand(packageName: string): Promise<void> {
  logger.header(`📖 Package Info: ${packageName}`);

  if (!packageName) {
    logger.error('Please specify a package name');
    process.exit(1);
  }

  try {
    const spinner = logger.startSpinner('Fetching package information...');

    // Get package info from registry
    const packageInfo = await RegistryAPI.getPackageInfo(packageName);

    if (!packageInfo) {
      logger.failSpinner('Package not found');
      logger.error(`Package "${packageName}" not found in npm registry.`);
      process.exit(1);
    }

    logger.succeedSpinner('Information retrieved');

    // Check if package is in package.json
    const packageJson = await FileUtils.readJSON(FileUtils.getPackageJsonPath());
    let isDirect = false;
    let dependencyType = '';

    if (packageJson) {
      const depTypes = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];
      for (const depType of depTypes) {
        if (packageJson[depType] && packageJson[depType][packageName]) {
          isDirect = true;
          dependencyType = depType;
          break;
        }
      }
    }

    // Display basic info
    console.log();
    logger.section('Basic Information:');
    logger.log(`  Name: ${chalk.bold(packageInfo.name)}`);
    logger.log(`  Version: ${chalk.cyan(packageInfo.version)}`);

    if (packageInfo.description) {
      logger.log(`  Description: ${packageInfo.description}`);
    }

    if (packageInfo.homepage) {
      logger.log(`  Homepage: ${chalk.blue(packageInfo.homepage)}`);
    }

    // Dependency info
    console.log();
    logger.section('Dependency Information:');

    if (isDirect) {
      logger.log(`  ${chalk.green('✓')} Directly installed in ${chalk.bold(dependencyType)}`);
    } else {
      logger.log(`  ${chalk.yellow('○')} Not directly installed (may be a transitive dependency)`);
    }

    // Try to get dependency tree
    try {
      const { stdout } = await execa('npm', ['ls', packageName, '--depth=999'], {
        cwd: process.cwd(),
        reject: false,
      });

      if (stdout && stdout.includes(packageName)) {
        console.log();
        logger.section('Dependency Tree:');
        logger.log(chalk.dim(stdout));
      }
    } catch (error) {
      // Ignore if npm ls fails
    }

    // Check if deprecated
    if (packageInfo.deprecated) {
      console.log();
      logger.warning('⚠️  This package is deprecated!');
      if (typeof packageInfo.deprecated === 'string') {
        logger.log(`  Reason: ${packageInfo.deprecated}`);
      }
    }

    console.log();

  } catch (error: any) {
    logger.error(`Failed to get package info: ${error.message}`);
    process.exit(1);
  }
}
