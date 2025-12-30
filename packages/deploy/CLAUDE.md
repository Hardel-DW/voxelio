# CLAUDE.md
This file provides guidance to Claude Code when working with this repository, This is a TSDown + TypeScript, OXC-Parser package built with Rolldown, Biome and Vitest.
Goal: Create a package of professional internationalisation for Vite, usable in thousands of production projects and frameworks.


## Architecture Overview
This is a Node.js CLI tool that automates deployment of Minecraft datapacks to Modrinth and CurseForge. The CLI guides users through:
1. Initial setup (deploy.yml config + GitHub workflow)
2. Creating changesets (markdown files with version bump info)
3. GitHub Actions workflow handles the actual deployment
4. Update Markdown description on Modrinth and CurseForge (Maybe different CLI for this)

We want to create a CLI that generates a *.md file in the .changeset/ folder with parameters, which allows deployment to Minecraft Modrinth and CurseForge.
Parameters:
- game_versions (minecraft versions)
- version_type (release, beta, alpha)
- version_bump (major, minor, patch)

How to use it:
1. Install it with `npm install -g @voxelio/deploy`
2. Use it with `npx voxset`

# Development Commands
- **Dev**: `npm run dev` - Run the CLI in development mode
- **Build**: `npm run build` - TypeScript compilation + Rolldown build
- **Format**: `npm run biome:unsafefix` - Check code with Biome linter
- **TS Lint check**: `npm run check` - Check code with TypeScript compiler
- **Test**: `npm run test` - Run tests with Vitest
- **Example**: `npm run example` - Run the example project vite in examples folder.

### Core Technologies
- **Runtime**: Node.js >= 24.0.0
- **Language**: TypeScript 7+
- **CLI Framework**: @clack/prompts (interactive prompts)
- **Schema Validation**: arktype (runtime type validation)
- **YAML Parsing**: yaml package
- **Build Tool**: tsdown (TypeScript bundler)
- **Linting/Formatting**: Biome (replaces ESLint/Prettier)

### Project Structure

```
src/
├── cli.ts              # CLI entry point (shebang + init command)
├── index.ts            # Programmatic API exports
├── commands/
│   └── init.ts         # Main command: setup + changeset creation
├── utils/
│   ├── changeset.ts    # Create changeset markdown files
│   ├── config.ts       # Read/write deploy.yml config
│   ├── datapack.ts     # Validate pack.mcmeta structure
│   ├── frontmatter.ts  # Parse YAML frontmatter from markdown
│   ├── version.ts      # Containing Minecraft versions and Java versions
│   └── workflow.ts     # Create GitHub Actions workflow
└── type.ts              # TypeScript types + arktype schemas

examples/
├── deploy.yml          # GitHub workflow template
├── example.yaml        # Example deploy.yml config
└── happy-pandas-dance.md  # Example changeset

dist/                   # Built output (tsdown)
```

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