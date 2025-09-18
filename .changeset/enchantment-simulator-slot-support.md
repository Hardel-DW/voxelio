---
"@voxelio/breeze": minor
---

Add slot-specific enchantment simulation support

- Add optional `slotIndex` parameter to `calculateEnchantmentProbabilities()` to calculate probabilities for specific enchantment table slots (0=top, 1=middle, 2=bottom)
- Add `getSlotLevelRanges()` method to calculate min/max level ranges for each enchantment table slot based on bookshelf count
- Add `SlotLevelRange` interface for slot range data
- Improve probability calculation accuracy by allowing slot-specific analysis instead of averaging all three slots