import chalk from 'chalk';
import ora, { type Ora } from 'ora';

export class Logger {
  private spinner: Ora | null = null;

  success(message: string): void {
    console.log(chalk.green('✓'), message);
  }

  error(message: string): void {
    console.log(chalk.red('✗'), message);
  }

  warning(message: string): void {
    console.log(chalk.yellow('⚠'), message);
  }

  info(message: string): void {
    console.log(chalk.blue('ℹ'), message);
  }

  log(message: string): void {
    console.log(message);
  }

  header(message: string): void {
    console.log('\n' + chalk.bold.cyan(message) + '\n');
  }

  section(message: string): void {
    console.log(chalk.bold('\n' + message));
  }

  startSpinner(text: string): Ora {
    this.spinner = ora(text).start();
    return this.spinner;
  }

  succeedSpinner(text?: string): void {
    if (this.spinner) {
      this.spinner.succeed(text);
      this.spinner = null;
    }
  }

  failSpinner(text?: string): void {
    if (this.spinner) {
      this.spinner.fail(text);
      this.spinner = null;
    }
  }

  stopSpinner(): void {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }

  table(data: Record<string, string>[]): void {
    if (data.length === 0) return;

    const keys = Object.keys(data[0] || {});
    const colWidths = keys.map(key => {
      const maxLen = Math.max(
        key.length,
        ...data.map(row => String(row[key] || '').length)
      );
      return maxLen + 2;
    });

    // Header
    const header = keys.map((key, i) => key.padEnd(colWidths[i] || 0)).join(' ');
    console.log(chalk.bold(header));
    console.log('─'.repeat(header.length));

    // Rows
    data.forEach(row => {
      const rowStr = keys.map((key, i) =>
        String(row[key] || '').padEnd(colWidths[i] || 0)
      ).join(' ');
      console.log(rowStr);
    });
    console.log();
  }

  colorize = {
    success: (text: string) => chalk.green(text),
    error: (text: string) => chalk.red(text),
    warning: (text: string) => chalk.yellow(text),
    info: (text: string) => chalk.blue(text),
    bold: (text: string) => chalk.bold(text),
    dim: (text: string) => chalk.dim(text),
  };
}

export const logger = new Logger();
