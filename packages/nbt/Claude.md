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

 ✓ test/bench/write.bench.ts > NBT Write - No Compression 2445ms
     name                                            hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · cube.nbt - write uncompressed               9.3033  103.41  119.27  107.49  107.62  119.27  119.27  119.27  ±2.92%       10
   · taiga_armorer_2.nbt - write uncompressed  1,515.58  0.5391  1.3686  0.6598  0.6749  1.1523  1.2140  1.3686  ±1.12%      758

 ✓ test/bench/write.bench.ts > NBT Write - With Compression (pako included) 6706ms
     name                                  hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · cube.nbt - write gzip             5.6352  175.20  179.30  177.46  178.22  179.30  179.30  179.30  ±0.47%       10
   · cube.nbt - write zlib             5.6221  172.15  194.30  177.87  181.01  194.30  194.30  194.30  ±2.72%       10
   · taiga_armorer_2.nbt - write gzip  860.15  1.0017  3.4579  1.1626  1.1861  1.4764  1.5711  3.4579  ±1.11%      431

 ✓ test/bench/write.bench.ts > NBT Round-trip - No Compression 3964ms
     name                                    hz     min      max    mean     p75     p99    p995     p999     rme  samples
   · cube.nbt - read + write             5.1764  177.73   223.54  193.19  192.94  223.54  223.54   223.54  ±4.31%       10
   · taiga_armorer_2.nbt - read + write  853.27  0.9346  10.0912  1.1720  1.1190  4.5386  7.4592  10.0912  ±5.93%      427

 ✓ test/bench/read.bench.ts > NBT Read - Full Parse (no compression) 2063ms
     name                                    hz      min      max     mean      p75      p99     p995     p999     rme  samples
   · cube.nbt - full parse              11.9331  68.2823  99.6692  83.8006  92.6881  99.6692  99.6692  99.6692  ±9.94%       10
   · taiga_armorer_2.nbt - full parse  2,449.16   0.3611  10.2478   0.4083   0.3806   0.5832   0.7273   9.1201  ±6.25%     1225

 ✓ test/bench/read.bench.ts > NBT Read - Selective Parse (no compression) 2201ms
     name                                           hz      min      max     mean      p75      p99     p995     p999     rme  samples
   · cube.nbt - selective [DataVersion]        32.7679  29.1299  34.5401  30.5177  30.7589  34.5401  34.5401  34.5401  ±1.98%       17
   · cube.nbt - selective [DataVersion, size]  34.6600  28.5928  29.1942  28.8517  28.9349  29.1942  29.1942  29.1942  ±0.25%       18
   · cube.nbt - selective [palette]            34.5002  28.7656  29.3248  28.9854  29.0380  29.3248  29.3248  29.3248  ±0.24%       18

 ✓ test/bench/read.bench.ts > NBT Read - Lazy Loading (no compression) 2182ms
     name                                      hz      min      max     mean      p75      p99     p995     p999     rme  samples
   · cube.nbt - lazy init + keys()        34.3822  28.6915  34.0889  29.0848  28.8275  34.0889  34.0889  34.0889  ±2.14%       18
   · cube.nbt - lazy get single field     34.4676  28.5991  30.6220  29.0128  29.4277  30.6220  30.6220  30.6220  ±0.95%       18
   · cube.nbt - lazy get multiple fields  34.4041  28.9144  29.6968  29.0663  29.0953  29.6968  29.6968  29.6968  ±0.30%       18

 ✓ test/bench/read.bench.ts > NBT Read - With Compression (pako included) 2278ms
     name                                              hz      min     max     mean     p75     p99    p995    p999     rme  samples
   · cube.nbt - full parse with gzip              10.0398  92.1698  105.46  99.6039  101.07  105.46  105.46  105.46  ±3.18%       10
   · taiga_armorer_2.nbt - full parse with gzip  2,033.02   0.4367  0.9728   0.4919  0.4984  0.7273  0.7808  0.8494  ±0.68%     1017