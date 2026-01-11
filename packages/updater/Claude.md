# CLAUDE.md
This file provides guidance to Claude Code when working with this repository, This is a TSDown + TypeScript package built with Rolldown, Biome and Vitest.
This projects is intended for a large public use, so we need to be careful with the code and the performance, me and you claude are expert/senior software engineers with mature approaches. Prioritise a good implementation over a quick and dirty one that fixes the issue in the immediate term. concise in our conversations I am a senior dev.
Goal:  Make a lightweight and performant depencies, to include in webview to update a datapack/resourcepack to another version

Input/Output of the updater package:
Record<string, Uint8Array>

Chained logic with delta:
- Each version knows how to convert to the next version
- Recursive application: v1 → v2 → v3 → ... → vN

We will parse Misode's changelogs, extract breaking changes, and create the logic in TS
---

# Development Commands
- **Build**: `npm run build` - TypeScript compilation + Rolldown build
- **Format**: `npm run biome:unsafefix` - Check code with Biome linter
- **TS Lint check**: `npm run check` - Check code with TypeScript compiler
- **Test**: `npm run test` - Run tests with Vitest

# Development Notes:
Dependencies: Only voidzero (Vite/Rolldown/oxc/vitest/tsdown) - no external deps.
- Breeze: The main core, already used by several projects
- diff: Generic JSON manipulation (not Minecraft-related)
- zip: Replacement for jszip
- nbt: NBT file manipulation (regions, structures, player data)
- parser: Dependency graphs between data-driven elements

We base our work on Misode's archived work:
1. packages/updater/upgrader-main - His old updater repo (no longer maintained since 1.20)
2. breaking-changes.json - Changelogs with breaking changes

# Global Rules of projects :
- No code redundancy, check existing code before implementing new features.
- Avoid "any" and "unknown" if possible, it is preferable to request authorization.
- No Legacy or Deprecated support.
- At the end of each sessions, check with `npm run lint`
- No Null Assertion "!"
- Prefer early returns for smooth code.
- No .foreach prefer for of or any loop.

It's not mandatory but you can use modern syntax ES2024 like Map.groupby or other thing.
Map -> groupBy()
Object -> map().filter().find().findLast().sort().toSorted().toReversed().fromEntries().groupBy()
Array -> findLast().toSorted().toReversed().with().toSpliced().fromAsync()
Set -> intersection().union().difference().symmetricDifference().isSubsetOf().isSupersetOf().isDisjointFrom()
Nullish Coalescing -> ??
Logical Assignment -> ||=
Float16Array