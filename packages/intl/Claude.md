# CLAUDE.md
This file provides guidance to Claude Code when working with this repository, This is a TSDown + TypeScript, OXC-Parser package built with Rolldown, Biome and Vitest.
Goal: Extract keys from tsx/jsx files and automatically generate translation files.

Functionalities to implement:
- Extract keys from tsx/jsx files and automatically generate translation files.
- Syntax like import { t } from "@voxelio/intl";
- Use : `t("Hello World")`, and Hello world will be replace by hash at compile time -> `t("abcdef")`
- Source locale is configurable (default: 'en')
- The JSON will automatically be generated at `src/locales/en.json` and will add ou removes unused keys.
- If other ".json" files are present, they will be also add with en.json keys and removed unused keys.
- HMR work of course.
- Hash strategy: Same text = same key globally (MD5 6 chars)
--- 

# Development Commands
- **Build**: `npm run build` - TypeScript compilation + Rolldown build
- **Format**: `npm run biome:unsafefix` - Check code with Biome linter
- **TS Lint check**: `npm run check` - Check code with TypeScript compiler
- **Test**: `npm run test` - Run tests with Vitest

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