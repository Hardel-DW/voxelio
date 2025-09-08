---
"@voxelio/breeze": minor
---

Add slot normalization functionality for enchantment grouping

- Add `normalizeSlots()` function to SlotManager for normalizing slot combinations
- Refactor `addSlot()` to use the new normalization logic  
- Update `EnchantmentSorter` to use slot normalization when grouping by slots
- Slot combinations are now normalized: ["mainhand", "offhand"] → ["hand"], ["head", "chest", "legs", "feet"] → ["armor"]
- Improves enchantment overview grouping by displaying logical slot categories instead of individual slot lists