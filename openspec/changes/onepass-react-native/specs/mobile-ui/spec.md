## ADDED Requirements

### Requirement: Unlock screen

The mobile app SHALL present an unlock screen requiring the master password.

#### Scenario: Password unlock

- **WHEN** the user enters their master password
- **THEN** the key is derived and the vault is opened
- **AND** the user is navigated to the entry list

#### Scenario: Biometric unlock

- **WHEN** the user taps "Use Biometrics"
- **AND** biometric authentication succeeds
- **THEN** the stored key is retrieved from secure storage
- **AND** the vault is opened without password entry

#### Scenario: Biometric unlock not available

- **WHEN** no biometric key has been stored
- **THEN** the biometric button is not shown
- **AND** only password unlock is available

#### Scenario: Incorrect password

- **WHEN** the user enters an incorrect password
- **THEN** an error message "Incorrect password" is shown
- **AND** the vault remains locked

### Requirement: Entry list screen

The mobile app SHALL display a searchable list of password entries.

#### Scenario: Display entries

- **WHEN** the vault is unlocked
- **THEN** all non-deleted entries are shown sorted by title
- **AND** each entry shows title and username

#### Scenario: Search entries

- **WHEN** the user types in the search field
- **THEN** the list filters to entries matching title, username, or url

#### Scenario: Tap entry

- **WHEN** the user taps an entry
- **THEN** the entry detail screen is shown

#### Scenario: Create new entry

- **WHEN** the user taps the floating action button
- **THEN** the entry form screen is shown for creating a new entry

### Requirement: Entry detail screen

The mobile app SHALL display full entry details with copy buttons.

#### Scenario: Display entry details

- **WHEN** an entry is viewed
- **THEN** title, username, password, url, and notes are shown
- **AND** password is masked by default with a toggle to reveal

#### Scenario: Copy field

- **WHEN** the user taps the copy button next to a field
- **THEN** the value is copied to clipboard
- **AND** a "Copied" snackbar is shown

#### Scenario: Edit entry

- **WHEN** the user taps the edit icon
- **THEN** the entry form screen is shown in edit mode

### Requirement: Entry form screen

The mobile app SHALL provide a form for creating and editing entries.

#### Scenario: Create new entry

- **WHEN** the form is submitted with valid data
- **THEN** the entry is saved to the vault
- **AND** the user is navigated back to the entry list

#### Scenario: Edit existing entry

- **WHEN** the form is opened in edit mode
- **THEN** existing values are pre-filled
- **AND** saving updates the entry with new `updated_at`

#### Scenario: Password generator

- **WHEN** the user taps the generate password button
- **THEN** a bottom sheet shows password generator options
- **AND** the user can adjust length and character classes
- **AND** tapping "Use" fills the password field

#### Scenario: Validation

- **WHEN** the user submits with empty title or username
- **THEN** a validation error is shown
- **AND** the entry is not saved

### Requirement: Category management screens

The mobile app SHALL allow managing categories.

#### Scenario: List categories

- **WHEN** the user navigates to category settings
- **THEN** all categories are shown with icon and color

#### Scenario: Create category

- **WHEN** the user creates a category
- **THEN** they can choose name, emoji icon, and color

#### Scenario: Delete category

- **WHEN** the user deletes a category
- **THEN** a confirmation dialog appears
- **AND** entries in that category are moved to "Uncategorized"

### Requirement: Settings screens

The mobile app SHALL provide settings for sync and import/export.

#### Scenario: Sync settings

- **WHEN** the user navigates to sync settings
- **THEN** the last sync status is shown
- **AND** a "Sync Now" button initiates LAN sync

#### Scenario: Export vault

- **WHEN** the user taps "Export Vault"
- **THEN** an encrypted `.onepass` file is saved to device storage
- **AND** the user is shown the file location

#### Scenario: Import vault

- **WHEN** the user taps "Import from File"
- **THEN** a file picker appears
- **AND** selecting a `.onepass` file merges it into the vault

### Requirement: Dark theme

The mobile app SHALL use a dark color scheme throughout.

#### Scenario: All screens use dark theme

- **WHEN** any screen is displayed
- **THEN** the background is dark (#1C1C1E)
- **AND** cards are slightly lighter (#2C2C2E)
- **AND** the accent color is blue (#0A84FF)
