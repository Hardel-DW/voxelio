# CLAUDE.md
This file provides guidance to Claude Code when working with this repository, This is a TSDown + TypeScript package built with Rolldown, Biome and Vitest.
Goal: Create a lightweight and fast Markdown parser and renderer for React.
Goal: Dependency graph between JSON files in a datapack.

This projects is intended for a large public use, so we need to be careful with the code and the performance, me and you claude are expert/senior software engineers with mature approaches. Prioritise a good implementation over a quick and dirty one that fixes the issue in the immediate term. concise in our conversations I am a senior dev.

We want to focus on a lightweight library, without external dependencies if possible, and fast. Ideally we don't parse everything at once but only the necessary files to maximize performance. With a resettable cache.

Input: UInt8Array (datapack) + pack_format (version) and schema API URL (default: https://api.spyglassmc.com/vanilla-mcdoc/symbols)
Output: Graph of file → references and file → referencedBy relationships

1. Fetch mcdoc schemas from API (browser/desktop cache on consumer side)
2. Traverse datapack JSON with corresponding schema
3. Extract values from #[id=...] fields = references
4. Build bidirectional graph
Versioning: Fields have since/until to filter by MC version.
Not needed: AST, custom mcdoc parser, external libs.

// Example of resolved mcdoc type
{kind: 'string',attributes: [{ name: 'id', value: { kind: 'literal', value: { value: 'loot_table' } } }]}
---

# Development Commands
- **Build**: `npm run build` - TypeScript compilation + Rolldown build
- **Format**: `npm run biome:unsafefix` - Check code with Biome linter
- **TS Lint check**: `npm run check` - Check code with TypeScript compiler
- **Test**: `npm run test` - Run tests with Vitest

# Development Notes:
- https://api.spyglassmc.com/vanilla-mcdoc/symbols → resolved mcdoc schemas (JSON)
- https://api.spyglassmc.com/mcje/versions → pack_format ↔ MC version mapping

● API Reference

/mcje/versions - MC version. An Array of objects. Example:
id	"26.1-snapshot-1"
name	"26.1 Snapshot 1"
release_target	null
type	"snapshot"
stable	false
data_version	4764
protocol_version	1073742111
data_pack_version	95
data_pack_version_minor	0
resource_pack_version	76
resource_pack_version_minor	0
build_time	"2025-12-16T12:41:11+00:00"
release_time	"2025-12-16T12:42:29+00:00"
sha1	"b9345ee364d36ef1c7ec26df6bf99d3e4a4393f5"

---
/vanilla-mcdoc/symbols - Resolved mcdoc schemas all version in one file. Example with until/since filter. Example
Types contains three properties:
- ref: string
- mcdoc: Record<string, McdocType> // "::java::data::loot::LootTable" → type
-'mcdoc/dispatcher': Record<string, Record<string, McdocType>> // "minecraft:loot_function" → { "set_count": type, "set_name": type, ... }

{ kind: "pair", key: "random_sequence", attributes: [{ name: "since", value: "1.20" }], type: { kind: "string", ... }}


In:
- readonly_docs_exemple/mcdoc-ts-generator-main we have example code of an mcdoc library for generating TypeScript types from mcdoc schemas. This can be useful as a reference.
- vanilla-mcdoc-main/vanilla-mcdoc-main we have the mcdocs.
- MCDOC_DOCUMENTATION.md is the complete documentation of mcdoc schemas. Written by me so may contain errors or be incomplete.

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