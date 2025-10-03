import { PackageAnalyzer } from '../core/analyzer.js';
import { logger } from '../utils/logger.js';
import type { AnalyzeOptions } from '../types/index.js';
import chalk from 'chalk';

export async function analyzeCommand(options: AnalyzeOptions): Promise<void> {
  logger.header('📦 Smart Updater - Package Analysis');

  const spinner = logger.startSpinner('Analyzing packages...');
  const analyzer = new PackageAnalyzer();

  try {
    const updates = await analyzer.analyzeUpdates(options.security);

    logger.succeedSpinner('Analysis complete!');

    if (updates.length === 0) {
      logger.success('All packages are up to date! 🎉');
      return;
    }

    logger.section(`Found ${updates.length} update(s) available:`);
    console.log();

    // Group by risk level
    const critical = updates.filter(u => u.riskLevel === 'critical');
    const breaking = updates.filter(u => u.riskLevel === 'breaking');
    const moderate = updates.filter(u => u.riskLevel === 'moderate');
    const safe = updates.filter(u => u.riskLevel === 'safe');

    if (critical.length > 0) {
      logger.log(chalk.bold.red(`\n🚨 CRITICAL (${critical.length}) - Security Issues`));
      critical.forEach(update => {
        logger.log(
          `  ${chalk.red('●')} ${chalk.bold(update.name)}: ${chalk.dim(update.currentVersion)} → ${chalk.green(update.latestVersion)} ${chalk.red('[SECURITY]')}`
        );
      });
    }

    if (breaking.length > 0) {
      logger.log(chalk.bold.red(`\n⚠️  BREAKING (${breaking.length}) - Major Updates`));
      breaking.forEach(update => {
        logger.log(
          `  ${chalk.red('●')} ${chalk.bold(update.name)}: ${chalk.dim(update.currentVersion)} → ${chalk.yellow(update.latestVersion)} ${chalk.dim('[' + update.dependencyType + ']')}`
        );
      });
    }

    if (moderate.length > 0) {
      logger.log(chalk.bold.yellow(`\n📝 MODERATE (${moderate.length}) - Minor Updates`));
      moderate.forEach(update => {
        logger.log(
          `  ${chalk.yellow('●')} ${chalk.bold(update.name)}: ${chalk.dim(update.currentVersion)} → ${chalk.blue(update.latestVersion)} ${chalk.dim('[' + update.dependencyType + ']')}`
        );
      });
    }

    if (safe.length > 0) {
      logger.log(chalk.bold.green(`\n✓ SAFE (${safe.length}) - Patch Updates`));
      safe.forEach(update => {
        logger.log(
          `  ${chalk.green('●')} ${chalk.bold(update.name)}: ${chalk.dim(update.currentVersion)} → ${chalk.cyan(update.latestVersion)} ${chalk.dim('[' + update.dependencyType + ']')}`
        );
      });
    }

    console.log();
    logger.info('Run `smart-updater update` to update packages interactively');
    logger.info('Run `smart-updater update --safe` to update only patch versions');
    logger.info('Run `smart-updater update --security` to update only security fixes');

  } catch (error: any) {
    logger.failSpinner('Analysis failed');
    logger.error(error.message);
    process.exit(1);
  }
}
