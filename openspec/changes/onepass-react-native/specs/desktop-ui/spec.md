## ADDED Requirements

### Requirement: Unlock window

The desktop app SHALL present an unlock window requiring the master password or biometrics.

#### Scenario: Password unlock

- **WHEN** the user enters their master password
- **THEN** the key is derived and the vault is opened
- **AND** the main window is shown

#### Scenario: Touch ID / Face ID unlock

- **WHEN** the user taps "Use Touch ID" (or Face ID)
- **AND** biometric authentication succeeds
- **THEN** the stored key is retrieved from macOS Keychain
- **AND** the vault is opened without password entry

### Requirement: Three-column layout

The desktop app SHALL use a three-column layout: sidebar, list, and detail.

#### Scenario: Landscape layout

- **WHEN** the window is wide enough
- **THEN** the left sidebar shows categories (160px)
- **AND** the middle column shows the entry list (200px)
- **AND** the right column shows entry detail (remaining width)

#### Scenario: Sidebar navigation

- **WHEN** the user taps a category in the sidebar
- **THEN** the entry list filters to that category

### Requirement: Sync server

The desktop app SHALL run an HTTP sync server discoverable via mDNS.

#### Scenario: Server starts on launch

- **WHEN** the app is unlocked
- **THEN** an HTTP server starts on port 47200 bound to LAN IP
- **AND** the server advertises `_onepass._tcp` via mDNS/Bonjour

#### Scenario: Server requires authentication

- **WHEN** a sync request is received
- **THEN** the `Authorization: Bearer <token>` header is required
- **AND** invalid tokens return 401 Unauthorized

#### Scenario: GET /sync returns changes

- **WHEN** a GET /sync?since=<ts> request is received
- **THEN** entries and categories modified after <ts> are returned
- **AND** a `serverTs` timestamp is included

#### Scenario: POST /sync merges changes

- **WHEN** a POST /sync request is received with entries and categories
- **THEN** the changes are merged using last-write-wins + delete-wins
- **AND** a `{ok: true}` response is returned

#### Scenario: Server stops on lock

- **WHEN** the vault is locked
- **THEN** the HTTP server stops
- **AND** mDNS advertisement is withdrawn

### Requirement: Menu bar

The desktop app SHALL provide a standard macOS menu bar.

#### Scenario: File menu

- **WHEN** the File menu is opened
- **THEN** options for "New Entry", "Import", "Export", and "Quit" are shown

#### Scenario: Edit menu

- **WHEN** the Edit menu is opened
- **THEN** standard edit actions (Copy, Paste, Select All) are shown
- **AND** "Generate Password" is available

#### Scenario: View menu

- **WHEN** the View menu is opened
- **THEN** options to toggle sidebar visibility are shown

### Requirement: Keyboard shortcuts

The desktop app SHALL support keyboard shortcuts for common actions.

#### Scenario: Create entry shortcut

- **WHEN** the user presses Cmd+N
- **THEN** a new entry form is opened

#### Scenario: Search shortcut

- **WHEN** the user presses Cmd+F
- **THEN** the search field is focused

#### Scenario: Copy password shortcut

- **WHEN** the user presses Cmd+C on an entry detail
- **THEN** the password is copied to clipboard

#### Scenario: Lock vault shortcut

- **WHEN** the user presses Cmd+L
- **THEN** the vault is locked
- **AND** the unlock window is shown

### Requirement: System tray / Dock integration

The desktop app SHALL integrate with macOS Dock.

#### Scenario: Dock icon shows lock state

- **WHEN** the vault is locked
- **THEN** the Dock icon shows a locked indicator
- **WHEN** the vault is unlocked
- **THEN** the indicator is removed

#### Scenario: Dock menu

- **WHEN** the user right-clicks the Dock icon
- **THEN** options for "New Entry", "Lock Vault", and "Quit" are shown

### Requirement: Dark mode support

The desktop app SHALL follow macOS appearance settings.

#### Scenario: Dark mode

- **WHEN** macOS is in Dark Mode
- **THEN** the app uses dark colors matching system appearance

#### Scenario: Light mode

- **WHEN** macOS is in Light Mode
- **THEN** the app uses light colors matching system appearance

#### Scenario: Automatic switching

- **WHEN** the user changes macOS appearance
- **THEN** the app immediately switches to match
