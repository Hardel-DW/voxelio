# CLAUDE.md
This file provides guidance to Claude Code when working with this repository, This is a TSDown + TypeScript, OXC-Parser package built with Rolldown, Biome and Vitest.
Goal: Create a package of professional internationalisation for Vite, usable in thousands of production projects and frameworks.
Warning: t() is automatically escaped by react so no XSS possible, if the user uses dangerouslySetInnerHTML at his own risk (That make no sense to use t() in that case).

Already implemented:
- Extract keys from tsx/jsx files and automatically generate translation files.
- Syntax like import { t } from "@voxelio/intl";
- Use : `t("Hello World")`, and Hello world will be replace by hash at compile time -> `t("abcdef")`
- Default locale, and default path folder is configurable in vite.config.ts (default: 'en')
- The JSON will automatically be generated at `src/locales/en.json`.
- Remove unused/obsolete keys from the JSON file when changing a key in tsx files.
- If other ".json" files are present, The keys will be also added to the other files, with the o.g translations.
- HMR work of course when changing a key in tsx files.
- Hash strategy: Same text = same key globally
- Interpolation support: t("Hello {name}", { name: "John" }) → "Hello John"
- We can detect the lang with url, cookie, header, localstorage or context/function.

Functionalities to implement:
For SSG/SSR : (Need Brain storming)
- A "build mode" with no .json or runtime code of intl in the final bundle.
- A "runtime mode" for SSR/SSG the translations is done on the client by sending the list of keys. Only the keys used will be sent.
- Vite Framework-agnostic, maybe a package for each framework Astro/TanStack/React/Vue/Svelte/Solid/SvleteKit/Nuxt. To correctly manage route.
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

It's not mandatory but you can use modern syntax ES2024 like Map.groupby or other thing.
Map -> groupBy()
Object -> map().filter().find().findLast().sort().toSorted().toReversed().fromEntries().groupBy()
Array -> findLast().toSorted().toReversed().with().toSpliced().fromAsync()
Set -> intersection().union().difference().symmetricDifference().isSubsetOf().isSupersetOf().isDisjointFrom()
Nullish Coalescing -> ??
Logical Assignment -> ||=
Float16Array