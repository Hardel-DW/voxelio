# CLAUDE.md
This file provides guidance to Claude Code when working with this repository, This is a TSDown + TypeScript, OXC-Parser package built with Rolldown, Biome and Vitest.
Goal: Create a package of professional internationalisation for Vite, usable in thousands of production projects and frameworks.

Config in vite plugin :
- Mandatory: sourceLocale: string; // The source locale to use (must be in locales array)
- Mandatory: locales: string[]; // Array of supported locales
- Optional: localesDir?: string; (default: './src/locales') // The directory to store the locales
- Optional: include?: string[]; (default: ['jsx', 'tsx']) // File extensions to process
- Optional: silent?: boolean; (default: false) // Disable warning logs

Already implemented:
- Extract keys from tsx/jsx files and automatically generate translation files.
- Syntax like `import { t } from "@voxelio/intl"`
- Use : `t("Hello World")`, and Hello world wiil be automatically added to locales json file with key -> `t("hello_world")` at compile time.
- The JSON will automatically be generated at `src/locales/en.json`.
- Remove unused/obsolete keys from the JSON file when changing a key in tsx files. It will be added to cache.
- The new keys are generated in all .json files locales specified in the plugin config.
- HMR work of course when changing a key in tsx files.
- Interpolation support: t("Hello {name}", { name: "John" }) → "Hello John"
- We can detect the lang with url, cookie, header, localstorage or context/function.
- The key are generated to be lisible by human during dev.
- During the `npx vite build` the keys and parameters are minified. New json are generated to not impact the locales folders.
- .cache folder contain obsolete keys, when user re-implement the same key, the key will be restored from cache and removed from .cache folder.
- When delete locale file, if will be regenerate.
- When key is removed manually, it will be restored with default locale key.
- When Start vite dev server, the locales will be created if not exist.

For SSR/SSG/CSR:
- A "Unified" mode: Each language is bundled into a single .js file in the dist folder, containing all translation keys for that language. Regardless of the number of chunks, there's only one translation file per language.
- An "Inline" mode: Translation values are directly injected into the t() function at build time, returning plain strings. The runtime only includes a minimal interpolation function (~100 bytes, 2 lines of code). (No Fetching and the lang cannot be changed at runtime)
- A "Granular" mode: Each Vite chunk is analyzed and generates its own translation chunk containing only the keys used in that specific chunk. This dramatically increases the number of requests and files but guarantees minimal bundle size per chunk.

Warning:
- t() is automatically escaped by react so no XSS possible, if the user uses dangerouslySetInnerHTML at his own risk (That make no sense to use t() in that case).
- No Pluralization support this feature is not compatible with the current paradigm of the package.
--- 

# Development Commands
- **Build**: `npm run build` - TypeScript compilation + Rolldown build
- **Format**: `npm run biome:unsafefix` - Check code with Biome linter
- **TS Lint check**: `npm run check` - Check code with TypeScript compiler
- **Test**: `npm run test` - Run tests with Vitest
- **Example**: `npm run example` - Run the example project vite in examples folder.

# Global Rules of projects :
This projects is intended for a large public use, so we need to be careful with the code and the performance, me and you claude are expert/senior software engineers with mature approaches. Prioritise a good implementation over a quick and dirty one that fixes the issue in the immediate term. concise in our conversations I am a senior dev.
- No code redundancy, check existing code before implementing new features.
- Avoid "any" and "unknown" if possible, it is preferable to request authorization.
- No Legacy or Deprecated support.
- At the end of each sessions, check with `npm run lint`
- No Null Assertion "!"
- Prefer early returns for smooth code.
- No .foreach prefer for of or any loop.
- The examples folders can skip some claude rules like no null assertion "!"
- Must use AST if it's the best solution for the problem.
- Dont repeat yourself, use functions, classes, etc.

It's not mandatory but you can use modern syntax ES2024 like Map.groupby or other thing.
Map -> groupBy()
Object -> map().filter().find().findLast().sort().toSorted().toReversed().fromEntries().groupBy()
Array -> findLast().toSorted().toReversed().with().toSpliced().fromAsync()
Set -> intersection().union().difference().symmetricDifference().isSubsetOf().isSupersetOf().isDisjointFrom()
Nullish Coalescing -> ??
Logical Assignment -> ||=
Float16Array