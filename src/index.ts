// Export core functionality for programmatic use
export { PackageAnalyzer } from './core/analyzer.js';
export { PackageUpdater } from './core/updater.js';
export { SnapshotManager } from './core/snapshot.js';
export { ImpactTester } from './core/tester.js';
export { RegistryAPI } from './core/registry.js';

// Export utilities
export { FileUtils } from './utils/files.js';
export { NPMUtils } from './utils/npm.js';
export { GitUtils } from './utils/git.js';
export { logger, Logger } from './utils/logger.js';

// Export types
export * from './types/index.js';
