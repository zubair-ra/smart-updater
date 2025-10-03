# smart-updater

Intelligent npm package updater with safety checks, impact analysis, and rollback capabilities.

## Features

- 📊 **Smart Analysis**: Analyze outdated packages with risk categorization
- 🔒 **Safety First**: Create automatic snapshots before updates
- 🧪 **Impact Testing**: Test updates in isolation before applying
- ⏮️ **Easy Rollback**: Restore previous package states instantly
- 🔍 **Dependency Insights**: Understand why packages are installed
- 🎯 **Interactive Mode**: Choose exactly which packages to update
- 🚨 **Security Focused**: Prioritize security vulnerability fixes

## Installation

```bash
npm install -g @mzubair746r/smart-updater
```

Or use with npx:

```bash
npx @mzubair746r/smart-updater
```

## Usage

### Analyze Packages

Check for outdated packages and security issues:

```bash
smart-updater analyze
```

Options:
- `-s, --security` - Show only security updates
- `-v, --verbose` - Show detailed information

### Update Packages

Update packages with interactive selection:

```bash
smart-updater update
```

Options:
- `-i, --interactive` - Select packages interactively (default)
- `-s, --security` - Update only security fixes
- `--safe` - Update only patch versions
- `--all` - Update all packages (with confirmation)
- `--skip-tests` - Skip running tests

Examples:

```bash
# Interactive mode
smart-updater update

# Only security updates
smart-updater update --security

# Only safe patch updates
smart-updater update --safe

# Update all packages
smart-updater update --all
```

### Test Package Updates

Test the impact of updating a specific package before applying:

```bash
smart-updater test axios@1.6.0
```

This will:
- Create a temporary git branch (if using git)
- Apply the update
- Run your test suite
- Check TypeScript compilation (if applicable)
- Report results without affecting your current state

### Rollback

Restore packages to a previous snapshot:

```bash
smart-updater rollback
```

Interactively select from available snapshots to restore.

### Why Command

Get detailed information about a package:

```bash
smart-updater why lodash
```

Shows:
- Package information
- Whether it's a direct or transitive dependency
- Dependency tree
- Deprecation status

## How It Works

### Risk Categorization

Smart-updater categorizes updates by risk level:

- 🚨 **CRITICAL** - Security vulnerabilities
- ⚠️ **BREAKING** - Major version updates
- 📝 **MODERATE** - Minor version updates
- ✓ **SAFE** - Patch version updates

### Snapshot System

Before every update, smart-updater automatically creates a snapshot of:
- `package.json`
- `package-lock.json`

Snapshots are stored in `.smart-updater/snapshots/` (added to `.gitignore` automatically).

### Impact Testing

The test command creates an isolated environment to verify updates:
1. Creates a temporary git branch
2. Applies the package update
3. Runs `npm test`
4. Checks TypeScript compilation (if `tsconfig.json` exists)
5. Reports results
6. Cleans up (switches back and deletes test branch)

## Configuration

Smart-updater works with your existing project configuration:

- Reads test command from `package.json` scripts
- Detects TypeScript projects automatically
- Works with both npm and yarn (detects from lock file)
- Integrates with git for advanced features

## Requirements

- Node.js >= 18.0.0
- npm or yarn
- Git (optional, for advanced features)

## Project Structure

```
smart-updater/
├── src/
│   ├── cli/           # CLI entry point
│   ├── commands/      # Command implementations
│   ├── core/          # Core logic (analyzer, updater, tester)
│   ├── utils/         # Utilities (npm, git, files, logger)
│   └── types/         # TypeScript interfaces
├── dist/              # Compiled output
└── package.json
```

## Development

Build the project:

```bash
npm run build
```

Run in development mode:

```bash
npm run dev
```

Link for local testing:

```bash
npm link
```

## Security

Smart-updater follows security best practices:

- Input validation for all user inputs
- Sanitized package names before registry calls
- No code execution from external sources
- Read-only operations where possible
- Confirmation required for destructive operations

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## Author

Created with ❤️ for safer npm package updates
