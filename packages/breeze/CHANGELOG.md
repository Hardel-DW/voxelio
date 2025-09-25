# @voxelio/breeze

## 1.8.6

### Patch Changes

- e5b70b7: Fix 'any' slot logic to require all 8 slots and add flattenSlots function

## 1.8.5

### Patch Changes

- 15353b2: Integrate LootTableFlattener into Studio UI, flattening datapack + vanilla loot tables and displaying accurate probabilities.

## 1.8.4

### Patch Changes

- ea0957e: Expose LootTableFlattener via core exports so Studio can consume it.

## 1.8.3

### Patch Changes

- 00ba6de: Add loot table flattening utility with unit and datapack integration tests to support Studio UI.

## 1.8.2

### Patch Changes

- aa4c165: Add getFlattenedPrimaryItems method to EnchantmentSimulator

## 1.8.1

### Patch Changes

- 3d11258: Fix EnchantmentSimulator tag resolution in exclusive_set compatibility

  - Fixed areEnchantmentsCompatible() to resolve tag references in exclusive_set
  - Added resolveExclusiveSet() method for proper tag expansion
  - Improved buildItemTagToEnchantmentsMap() with modern syntax
  - Fixed double # prefix issue in findPossibleEnchantments()

## 1.8.0

### Minor Changes

- 686617f: Add TagCompiler class for processing datapack tags with merge and flatten functionality

## 1.7.0

### Minor Changes

- 8470a9c: Add slot-specific enchantment simulation support

  - Add optional `slotIndex` parameter to `calculateEnchantmentProbabilities()` to calculate probabilities for specific enchantment table slots (0=top, 1=middle, 2=bottom)
  - Add `getSlotLevelRanges()` method to calculate min/max level ranges for each enchantment table slot based on bookshelf count
  - Add `SlotLevelRange` interface for slot range data
  - Improve probability calculation accuracy by allowing slot-specific analysis instead of averaging all three slots

## 1.6.0

### Minor Changes

- fbe3969: Add slot normalization functionality for enchantment grouping

  - Add `normalizeSlots()` function to SlotManager for normalizing slot combinations
  - Refactor `addSlot()` to use the new normalization logic
  - Update `EnchantmentSorter` to use slot normalization when grouping by slots
  - Slot combinations are now normalized: ["mainhand", "offhand"] → ["hand"], ["head", "chest", "legs", "feet"] → ["armor"]
  - Improves enchantment overview grouping by displaying logical slot categories instead of individual slot lists

## 1.5.0

### Minor Changes

- 6c3dbc7: Minorr refactoring and improvements

- Update Version.ts and package exports
- Fix ArrayBufferLike compatibility issue in File constructor (test utils)
- Update structure_set domain actions
- Clean up tsconfig.json
- Sorter for Enchantments, allow to sort enchantments by exclusiveSet, supportedItems, slots.
- Get a random items from a Tags (Allow recursive tags).
- New Loot table probability calculation.

### Patch Changes

- Updated dependencies [6c3dbc7]
  - @voxelio/zip@3.2.0
