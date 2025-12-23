# CLAUDE.md
This file provides guidance to Claude Code when working with this repository, This is a TSDown + TypeScript package built with Rolldown, Biome and Vitest.
This projects is intended for a large public use, so we need to be careful with the code and the performance, me and you claude are expert/senior software engineers with mature approaches. Prioritise a good implementation over a quick and dirty one that fixes the issue in the immediate term. concise in our conversations I am a senior dev.
Goal:  Make a lightweight and performant NBT library combining the lazy loading optimizations.

- No vtable overhead
- Pattern matching with switch
- TypeScript optimizes well
---

# Development Commands
- **Build**: `npm run build` - TypeScript compilation + Rolldown build
- **Format**: `npm run biome:unsafefix` - Check code with Biome linter
- **TS Lint check**: `npm run check` - Check code with TypeScript compiler
- **Test**: `npm run test` - Run tests with Vitest

## Dependencies
- pako for gzip/zlib (to add to package.json)

## API
```ts
const file = NbtFile.read(data);
const name = file.getString("Name");

const file = NbtFile.readSelective(data, ["DataVersion", "Level"]);
const lazy = new LazyNbtFile(data);
const field = lazy.get("DataVersion");

const file = new NbtFile("", nbt.compound({
    Name: nbt.string("Test"),
    Level: nbt.int(42)
}));
const bytes = file.write({ compression: Compression.Gzip });
```

##Structure des fichiers
packages/nbt/src/
├── index.ts           # Exports publics
├── types.ts           # Discriminated union NbtTag + NbtType enum
├── tags.ts            # Factories nbt.byte(), nbt.compound(), etc.
├── guards.ts          # Type guards: isByte(), isCompound(), etc.
├── reader.ts          # NbtReader avec cursor + skip + selective parsing
├── writer.ts          # NbtWriter avec buffer dynamique
├── file.ts            # NbtFile API haut niveau
├── lazy.ts            # LazyNbtFile pour parsing à la demande
├── compression.ts     # gzip/zlib via pako
├── snbt.ts            # Parser/formatter SNBT (optionnel, phase 2)
└── error.ts           # NbtError + NbtErrorKind

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