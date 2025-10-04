# CLAUDE.md
This file provides guidance to Claude Code when working with this repository, This is a TSDown + TypeScript package built with Rolldown, Biome and Vitest.
Goal: Handles diff between two JSON objects with RFC 6902 (Modified to preserve key order), and make a patch file, also provides a tool to apply the patch to a JSON object.

Functionalities to implement:
- Diff between two JSON objects, and make a patch file. -> new Differ().diff(obj1, obj2);
- Apply the patch to a JSON object. -> Differ.apply(obj, patch);

This should only compare files and only JSON. So create a logic specially designed for this not create something complex.
There will be no options available, unlike in the libs.
We want compare JSON not a JS object So we want only number (2, -0.5, 3e6, Infinity), string (Escaped), boolean, list, object and nothing else. No Class, Function, Infinite, BigInt, etc.

Keep this options like default for Differ class, we don't want options in this package so keep it but no peronnalization:
- No depth limit is applied when traversing objects (uses Number.POSITIVE_INFINITY).
- Both additions and modifications are displayed in the diff output.
- Arrays are compared using the Longest Common Subsequence (LCS) algorithm for better diff accuracy.
- String values are compared with case sensitivity.
- Object keys are compared with case sensitivity.
- Nested objects and arrays use deep equality comparison.
- Object keys are preserved according to the source object's order.

Do not implement visual, html, css or anything like that.
Idealy we want .diff files, with hunk like this:
```
@@ -1,2 +1,2 @@
- { "key": "value" }
+ { "key": "value2" }
```
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