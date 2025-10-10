# @voxelio/diff

A library for generating and applying JSON patches RFC 6902 in TypeScript. Only 4KB and 1.9KB gzipped no dependencies.
- generate JSON RFC 6902 patches while preserving key order (`Differ.diff`),
- apply these patches safely (`Differ.apply`),
- align a modified JSON object to the key order of an original version (`Differ.reorder`).

## Usage rapide

```ts
import { Differ } from "@voxelio/diff";

const patch = new Differ(original, updated).diff();
const aligned = new Differ(original, updated).reorder();
const result = Differ.apply(original, patch);
```

- Tests with vitest : `pnpm run test` 
- Build with tsdown : `pnpm run build`
- Lint and format with biome : `pnpm run biome:format` and `pnpm run biome:check`