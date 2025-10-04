# CLAUDE.md
This file provides guidance to Claude Code when working with this repository, This is a TSDown + TypeScript package built with Rolldown, Biome and Vitest.
Goal: Handles diff between two JSON objects, and make a patch file, also provides a tool to apply the patch to a JSON object.

Functionalities to implement:
- Diff between two JSON objects, and make a patch file. -> new Differ().diff(obj1, obj2);
- Apply the patch to a JSON object. -> Differ.apply(obj, patch);

They are part of an existing repository, and we are going to completely empty it to leave only the utilities we want, We're going to rewrite it in modern TS and Node and test it in Vitest.

This should only compare files and only JSON.
There will be no options available, unlike in the libs.

Keep this options like default for Differ class, we don't want options in this package so keep it but no peronnalization:
- detectCircular: true,
- maxDepth: null,
- showModifications: true,
- arrayDiffMethod: 'unorder-lcs',
- ignoreCase: false,
- ignoreCaseForKey: false,
- recursiveEqual: true,
- preserveKeyOrder: 'before'

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