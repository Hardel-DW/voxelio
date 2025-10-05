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

# Context :
In another project (Breeze) we transform Minecraft Data Driven to a proprietary format and make changes to it, and after re-transforming it to the original format, we need to align the keys to the original order.

`new Differ(original, updated).diff()` will generate a patch with RFC 6902 format, and with the **apply** method i can put them in the datapack, to get the original data. And that allow to make **Revert** and **Migration** functionnality in web editor.

And the `reorder` method is used to align the keys to the original object, without generating a patch, i need it to prepare a github commit, wihout change every keys orders.