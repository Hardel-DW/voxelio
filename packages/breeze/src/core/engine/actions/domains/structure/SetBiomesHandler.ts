import type { StructureProps } from "@/core/schema/structure/types";
import type { ActionHandler } from "../../types";
import type { StructureAction } from "./types";

export class SetBiomesHandler implements ActionHandler<StructureAction> {
	execute(action: Extract<StructureAction, { type: "structure.set_biomes" }>, element: Record<string, unknown>): Record<string, unknown> {
		const structure = structuredClone(element) as StructureProps;
		if (action.replace) {
			structure.biomes = action.biomes;
			return structure;
		}

		const currentBiomes = Array.isArray(structure.biomes) ? structure.biomes : [];
		const existingBiomes = new Set(currentBiomes);
		const newBiomes = [...currentBiomes];

		for (const biome of action.biomes) {
			if (!existingBiomes.has(biome)) {
				newBiomes.push(biome);
			}
		}

		structure.biomes = newBiomes;
		return structure;
	}
}
