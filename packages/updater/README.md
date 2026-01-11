# EXTREMELY EXTREMELY EXTREMELY EARLY DEVELOPMENT STAGE
# DO NOT USE YET

# @voxelio/updater
This package allows you to update Minecraft datapack or resource pack files to a newer version.

It works on the principle of Chained Delta logic:
- Each version knows how to convert to the next version
- Recursive application: v1 → v2 → v3 → ... → vN

There is one TypeScript file for each breaking change, with each file handling a single migration.
This package can be used in a webview application. With:

```ts
import { update } from "@voxelio/updater";

update(files: Record<string, Uint8Array>, fromFormat: number, toFormat: number, options: UpdateOptions = {}): UpdateResult
```

The UpdateResult is the result of the update process, it contains the updated files, the warnings and the applied migrations.
- There is a force option. When some elements of Minecraft are removed, this option will replace the value by another. e.g. If a sound is removed, another sound will be used, chosen by the Voxel Upgrader development team. This option ensures that the final datapack works.

```ts
export interface UpdateResult {
	files: Record<string, Uint8Array>;
	warnings: string[];
	appliedMigrations: string[];
}

export interface UpdateOptions {
	force?: boolean;
}
```