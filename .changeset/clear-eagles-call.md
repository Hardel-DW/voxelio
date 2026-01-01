---
"@voxelio/breeze": patch
"@voxelio/diff": patch
---

Fixed areKeysInSameOrder to check the relative order of common keys instead of comparing lengths. Now deleting a key no longer triggers a “remove all + add all” operation. The migration is now correct and uses delete instead of undefined.
