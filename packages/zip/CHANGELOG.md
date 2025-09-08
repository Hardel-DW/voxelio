# @voxelio/zip

## 3.1.0

### Minor Changes

- 0353e83: Minor refactoring and improvements

  **Project Structure:**

  - Remove entire `@voxelio/nbt` package (55+ deleted files)
  - Add changesets configuration for better release management
  - Update root configuration files (README.md, biome.json, package.json, tsconfig.json)
  - Fix TypeScript compilation setup across packages
  - Fix CI/CD: Remove pnpm-lock.yaml from .gitignore and commit it for reproducible builds

  **@voxelio/zip:**

  - Remove unused `@ts-expect-error` directives that are no longer needed
  - Replace `@ts-ignore` with proper type handling in metadata.ts
  - Fix null safety when parsing Content-Length headers using Number() instead of unary +
  - Fix type compatibility by wrapping Uint8Array creation in unzip.ts to ensure proper ArrayBuffer type

  **@voxelio/breeze:**

  - Update Version.ts and package exports
  - Fix ArrayBufferLike compatibility issue in File constructor (test utils)
  - Update structure_set domain actions
  - Clean up tsconfig.json

  New Functionality in @voxelio/breeze:

  - Sorter for Enchantments, allow to sort enchantments by exclusiveSet, supportedItems, slots.
  - Get a random items from a Tags (Allow recursive tags).
  - New Loot table probability calculation.
