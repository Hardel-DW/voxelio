# CLAUDE.md
This file provides guidance to Claude Code when working with this repository, This is a TSDown + TypeScript package built with Rolldown, Biome and Vitest.

# Element Workflow:
## Step 1 - User Upload and Parse
User uploads their datapack as zip or jar.
1. Parser extracts metadata:
   - **namespaces**: `string[]`
   - **version**: `number`
   - **description**: `string`
   - **isModded**: `boolean`
   - **name**: `string`
   - **files**: `Record<string, Uint8Array<ArrayBufferLike>>`

2. Use File to traverse the datapack and extract element registries using the analyser.
3. Traverse elements to determine which tags they belong to and add them to the **tags** field.
4. Each element goes through the parser to be transformed from **DataDriven (Mojang)** format to **Voxel (Stable)** format, enabling proper multi-version handling and simplifying webapp/actions.

---

## Step 2 - User Interactions

1. User clicks on a UI component, which calls an action and tracks it (**trackChanges** and **updateData**).
2. Store changes in logs.
3. Modify the element and update the store.
4. Properly handle re-rendering with **zustand** and precise selectors to avoid unnecessary component re-renders.

---

## Step 3 - User Download & Compile

1. Use the immutable original **files**, modified **elements**, and **logs** (logs indicate which elements were modified: `"updated"`, `"added"`, `"deleted"`) from actions.
2. Each element goes through the **compiler** to be transformed from **Voxel (Stable)** format to **DataDriven (Mojang)** format for proper multi-version handling.
   2.5. Note: there's a "mode" field with values "Deleted", "Disabled", "Enabled", "Only Creative" that can impact tags or the element.

3. Traverse concept elements to create an **id map**.
4. Open each tag and remove ids based on the map, leaving only unknown ids.
5. Traverse each enchantment, iterate through its **tags** field, then open each tag to insert the enchantment's id.
6. Transform into **Datapack** instance.
7. Transform into **zip**.

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

# Testing
- For testing, place mock, in the "/test/mocks" folder, and unit tests in the "/test/core" folder.
- Avoid creating mock if already one exists.
- Mock contains folder for each concept, "Enchantment", "Loot", "Recipe"... Each folder has two files, "DataDriven.ts" and "VoxelDriven.ts" and Tags.ts.
- And utils.ts for creating zip or datapack instance or Record<string, Uint8Array>.
