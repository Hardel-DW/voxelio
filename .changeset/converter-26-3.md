---
"@voxelio/breeze": patch
"@voxelio/converter": patch
---

Know the pack formats up to 26.3 (88 for 1.21.9, 94 for 1.21.11, 101 for 26.1, 107 for 26.2, 121 for 26.3) and give a snapshot format the release it leads to. Export `LATEST_PACK_FORMAT`. The converter reads the description and the version of a datapack separately, so an unknown format no longer drops the description. Mod ids always satisfy Fabric and NeoForge (`toModId` is exported), every TOML value is escaped, and NeoForge receives the icon as `iconFile` as well as `logoFile`.
