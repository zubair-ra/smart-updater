export type UpdateType = 'major' | 'minor' | 'patch';
export type RiskLevel = 'critical' | 'breaking' | 'moderate' | 'safe';
export type DependencyType = 'dependencies' | 'devDependencies' | 'peerDependencies' | 'optionalDependencies';

export interface PackageUpdate {
  name: string;
  currentVersion: string;
  latestVersion: string;
  type: UpdateType;
  riskLevel: RiskLevel;
  hasSecurityIssue: boolean;
  changelogUrl?: string;
  breaking?: string[];
  dependencyType: DependencyType;
}

export interface TestResult {
  success: boolean;
  testsPass: boolean;
  typeScriptPass: boolean;
  bundleSizeDiff?: number;
  errors?: string[];
  duration?: number;
}

export interface Snapshot {
  id: string;
  timestamp: Date;
  packages: string[];
  files: {
    packageJson: string;
    packageLock: string;
  };
}

export interface AnalyzeOptions {
  security?: boolean;
  verbose?: boolean;
}

export interface UpdateOptions {
  interactive?: boolean;
  security?: boolean;
  safe?: boolean;
  all?: boolean;
  packages?: string[];
  skipTests?: boolean;
}

export interface PackageInfo {
  name: string;
  version: string;
  description?: string;
  repository?: {
    type: string;
    url: string;
  };
  homepage?: string;
  deprecated?: boolean | string;
  lastPublish?: Date;
}

export interface DependencyTree {
  name: string;
  version: string;
  isDirect: boolean;
  dependents: string[];
  size?: number;
  alternatives?: string[];
}

export interface SnapshotMetadata {
  id: string;
  timestamp: string;
  packages: string[];
  success: boolean;
}
