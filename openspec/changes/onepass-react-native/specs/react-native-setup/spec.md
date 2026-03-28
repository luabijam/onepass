## ADDED Requirements

### Requirement: Monorepo project structure

The project SHALL use a pnpm workspace monorepo with three packages: `vault-core`, `mobile`, and `desktop`.

#### Scenario: Initial project structure created

- **WHEN** the project is initialized
- **THEN** the following structure exists:
  - `packages/vault-core/` with TypeScript configuration
  - `packages/mobile/` with React Native Android configuration
  - `packages/desktop/` with React Native macOS configuration
  - `pnpm-workspace.yaml` referencing all packages
  - Root `package.json` with shared dev dependencies

#### Scenario: TypeScript is configured consistently

- **WHEN** TypeScript is configured
- **THEN** all packages use strict TypeScript with shared base config
- **AND** path aliases are set up for cross-package imports

### Requirement: pnpm workspace configuration

The monorepo SHALL use pnpm workspaces for dependency management.

#### Scenario: Workspace packages are linked

- **WHEN** `pnpm install` is run at root
- **THEN** all workspace packages are symlinked correctly
- **AND** `vault-core` is importable from both `mobile` and `desktop`

#### Scenario: Shared dependencies are deduplicated

- **WHEN** multiple packages depend on the same version of a library
- **THEN** pnpm hoists it to the root `node_modules`
- **AND** disk space is optimized

### Requirement: Build scripts

The project SHALL have build scripts for all packages.

#### Scenario: Build all packages

- **WHEN** `pnpm build` is run at root
- **THEN** `vault-core` is compiled to JavaScript
- **AND** mobile app bundles are generated
- **AND** desktop app bundles are generated

#### Scenario: Development mode

- **WHEN** `pnpm dev` is run at root
- **THEN** vault-core runs in watch mode
- **AND** mobile app starts Metro bundler
- **AND** changes are reflected immediately

### Requirement: Code quality tooling

The project SHALL include ESLint, Prettier, and Jest.

#### Scenario: Linting passes

- **WHEN** `pnpm lint` is run
- **THEN** all TypeScript files pass ESLint checks
- **AND** Prettier formatting is consistent

#### Scenario: Tests can run

- **WHEN** `pnpm test` is run
- **THEN** Jest executes all test files across packages
- **AND** coverage reports are generated
