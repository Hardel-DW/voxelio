---
"@voxelio/breeze": patch
---

Fix EnchantmentSimulator tag resolution in exclusive_set compatibility

- Fixed areEnchantmentsCompatible() to resolve tag references in exclusive_set
- Added resolveExclusiveSet() method for proper tag expansion
- Improved buildItemTagToEnchantmentsMap() with modern syntax
- Fixed double # prefix issue in findPossibleEnchantments()