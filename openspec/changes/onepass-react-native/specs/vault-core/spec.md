## ADDED Requirements

### Requirement: Encrypted SQLite database

The system SHALL store all data in an AES-256 encrypted SQLite database using SQLCipher.

#### Scenario: Database opens with derived key

- **WHEN** the user enters their master password
- **THEN** the system derives a 256-bit key using PBKDF2-SHA256 with 100,000 iterations
- **AND** the database is opened with the derived key as hex string prefixed with "x'"

#### Scenario: Database schema is initialized

- **WHEN** a new database is created
- **THEN** the `entries` table is created with columns: id, title, username, password, url, notes, category_id, is_favorite, created_at, updated_at, deleted_at
- **AND** the `categories` table is created with columns: id, name, icon, color, updated_at, deleted_at
- **AND** indexes are created on `entries(updated_at)` and `categories(updated_at)`

#### Scenario: Database operations are encrypted at rest

- **WHEN** the database file is inspected with a hex editor
- **THEN** the contents are not readable plaintext
- **AND** the file begins with SQLite format 3 header but all data pages are encrypted

### Requirement: Entry CRUD operations

The system SHALL provide create, read, update, and delete operations for password entries.

#### Scenario: Create new entry

- **WHEN** the user creates a new entry with title, username, and password
- **THEN** a new row is inserted into the entries table
- **AND** the entry has a UUID id, current timestamps, and `deleted_at` is null

#### Scenario: Soft delete entry

- **WHEN** the user deletes an entry
- **THEN** the `deleted_at` column is set to current timestamp
- **AND** the entry is excluded from normal queries
- **AND** the entry is included in sync queries (for propagating deletion)

#### Scenario: Search entries

- **WHEN** the user types a search query
- **THEN** entries are filtered by case-insensitive match on title, username, and url
- **AND** soft-deleted entries are excluded

### Requirement: Category management

The system SHALL support custom categories with name, icon, and color.

#### Scenario: Default category exists

- **WHEN** the database is initialized
- **THEN** an "Uncategorized" category exists with id "uncategorized"

#### Scenario: Create custom category

- **WHEN** the user creates a category with name, emoji icon, and hex color
- **THEN** the category is stored with a UUID id and current timestamp

#### Scenario: Delete category reassigns entries

- **WHEN** the user deletes a category
- **THEN** the category is soft-deleted
- **AND** all entries in that category are reassigned to "uncategorized"

### Requirement: PBKDF2 key derivation

The system SHALL derive encryption keys from the master password using PBKDF2.

#### Scenario: Key derivation is deterministic

- **WHEN** the same password and salt are used
- **THEN** the same 32-byte key is produced every time

#### Scenario: Key derivation uses strong parameters

- **WHEN** a key is derived
- **THEN** PBKDF2-SHA256 is used with 100,000 iterations
- **AND** a 16-byte random salt is generated on first use
- **AND** the salt is stored unencrypted in `salt.bin`

#### Scenario: Different passwords produce different keys

- **WHEN** different passwords are used with the same salt
- **THEN** different keys are produced

### Requirement: AES-256-GCM export encryption

The system SHALL export vault data as an encrypted `.onepass` file.

#### Scenario: Export creates encrypted file

- **WHEN** the user exports the vault
- **THEN** a JSON file is created containing: version (1), salt (base64), iv (base64), and ciphertext (base64)
- **AND** the ciphertext is AES-256-GCM encrypted with the derived key

#### Scenario: Import decrypts file

- **WHEN** the user imports a `.onepass` file
- **THEN** the file is decrypted using the derived key and embedded salt
- **AND** entries and categories are merged using last-write-wins + delete-wins

#### Scenario: Wrong password fails import

- **WHEN** the user imports a file with an incorrect password
- **THEN** decryption fails with an error message
- **AND** no data is modified

### Requirement: HMAC sync token

The system SHALL generate a sync authentication token from the derived key.

#### Scenario: Sync token is deterministic

- **WHEN** the sync token is computed from a key
- **THEN** HMAC-SHA256(key, "onepass-sync-token") is returned
- **AND** the same token is produced for the same key

### Requirement: Sync merge algorithm

The system SHALL merge remote changes using last-write-wins with delete-wins.

#### Scenario: Remote entry is newer

- **WHEN** a remote entry has a later `updated_at` than local
- **THEN** the remote version replaces the local version

#### Scenario: Local entry is newer

- **WHEN** a local entry has a later `updated_at` than remote
- **THEN** the local version is kept

#### Scenario: Delete always wins

- **WHEN** either side has `deleted_at` set
- **THEN** the merged result has `deleted_at` set
- **AND** the earlier deletion timestamp is preserved
