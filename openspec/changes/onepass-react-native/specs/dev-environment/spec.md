## ADDED Requirements

### Requirement: Devcontainer configuration

The project SHALL include a devcontainer configuration for reproducible development.

#### Scenario: Devcontainer builds successfully

- **WHEN** the devcontainer is opened in VS Code or Codespaces
- **THEN** Node.js 20 is installed
- **AND** pnpm is installed
- **AND** Android SDK command-line tools are available
- **AND** Xcode command-line tools are available (on macOS)

#### Scenario: Post-create command runs

- **WHEN** the devcontainer is first created
- **THEN** `pnpm install` installs all dependencies
- **AND** the project is ready for development

### Requirement: Dotfiles integration

The devcontainer SHALL support user dotfiles for neovim and tmux.

#### Scenario: Dotfiles repository is cloned

- **WHEN** the devcontainer is created with `dotfiles.repository` configured
- **THEN** the user's dotfiles repo is cloned
- **AND** the install script is executed

#### Scenario: Neovim is configured

- **WHEN** the user opens a file in neovim
- **THEN** LSP, treesitter, and other plugins from dotfiles work
- **AND** TypeScript/JavaScript language server is functional

#### Scenario: Tmux is configured

- **WHEN** the user starts tmux
- **THEN** the user's tmux configuration is loaded
- **AND** custom key bindings and theme are applied

### Requirement: Development scripts

The project SHALL include npm scripts for common development tasks.

#### Scenario: Start mobile app

- **WHEN** `pnpm dev:mobile` is run
- **THEN** the React Native Metro bundler starts
- **AND** the app can be loaded on an Android emulator or device

#### Scenario: Start desktop app

- **WHEN** `pnpm dev:desktop` is run
- **THEN** the React Native macOS bundler starts
- **AND** the app can be loaded on macOS

#### Scenario: Run tests

- **WHEN** `pnpm test` is run
- **THEN** Jest runs all tests across packages
- **AND** coverage reports are generated

#### Scenario: Lint and format

- **WHEN** `pnpm lint` is run
- **THEN** ESLint checks all TypeScript files
- **AND** Prettier formats code

#### Scenario: Build for production

- **WHEN** `pnpm build` is run
- **THEN** vault-core is compiled
- **AND** mobile app is bundled
- **AND** desktop app is bundled

### Requirement: Android development setup

The devcontainer SHALL support Android development.

#### Scenario: Android emulator available

- **WHEN** the devcontainer is running on a Linux host with KVM
- **THEN** the Android emulator can be started

#### Scenario: ADB can connect

- **WHEN** an Android device or emulator is connected
- **THEN** `adb devices` shows the device
- **AND** `pnpm android` can deploy the app

### Requirement: TypeScript configuration

The project SHALL have strict TypeScript configuration.

#### Scenario: Strict mode enabled

- **WHEN** TypeScript compiles the project
- **THEN** `strict: true` is enforced
- **AND** `noImplicitAny: true` catches implicit any types
- **AND** `strictNullChecks: true` prevents null/undefined errors

#### Scenario: Cross-package imports work

- **WHEN** mobile app imports from vault-core
- **THEN** TypeScript resolves the import correctly
- **AND** IDE autocompletion works

#### Scenario: Shared tsconfig base

- **WHEN** a new package is added
- **THEN** it can extend `tsconfig.base.json`
- **AND** consistent compiler options are enforced

### Requirement: Git hooks

The project SHALL use git hooks for code quality.

#### Scenario: Pre-commit hook runs linter

- **WHEN** a commit is made
- **THEN** ESLint runs on staged files
- **AND** Prettier formats staged files
- **AND** the commit is blocked if lint errors exist

#### Scenario: Pre-push hook runs tests

- **WHEN** a push is attempted
- **THEN** tests are run
- **AND** the push is blocked if tests fail

### Requirement: Environment documentation

The project SHALL document required environment setup.

#### Scenario: README contains setup instructions

- **WHEN** a new developer reads the README
- **THEN** prerequisites are clearly listed (Node.js, pnpm, Android SDK, Xcode)
- **AND** devcontainer setup steps are documented
- **AND** manual setup steps are documented as an alternative

#### Scenario: VS Code settings included

- **WHEN** the project is opened in VS Code
- **THEN** recommended extensions are suggested
- **AND** workspace settings for formatting are applied
