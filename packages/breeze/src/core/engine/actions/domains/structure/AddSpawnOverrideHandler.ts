import type { SpawnOverride, StructureProps } from "@/core/schema/structure/types";
import type { ActionHandler } from "../../types";
import type { StructureAction } from "./types";

export class AddSpawnOverrideHandler implements ActionHandler<StructureAction> {
	execute(
		action: Extract<StructureAction, { type: "structure.add_spawn_override" }>,
		element: Record<string, unknown>
	): Record<string, unknown> {
		const structure = structuredClone(element) as StructureProps;
		const newOverride: SpawnOverride = {
			mobCategory: action.mobCategory as any,
			boundingBox: action.boundingBox,
			spawns: action.spawns
		};

		const currentOverrides = Array.isArray(structure.spawnOverrides) ? structure.spawnOverrides : [];
		const existingOverrides = currentOverrides.filter((override: any) => override.mobCategory !== action.mobCategory);

		structure.spawnOverrides = [...existingOverrides, newOverride];

		return structure;
	}
}
