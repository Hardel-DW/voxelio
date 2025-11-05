import type {
	FrequencyReductionMethod,
	PlacementType,
	SpreadType,
	StructureSetProps,
	StructureSetStructure
} from "@/core/schema/structure_set/types";
import { Action } from "@/core/engine/actions/index";

export class StructureSetAction<P = any> extends Action<P> {
	constructor(
		params: P,
		private applyFn: (element: Record<string, unknown>, params: P) => Record<string, unknown>
	) {
		super(params);
	}

	apply(element: Record<string, unknown>): Record<string, unknown> {
		return this.applyFn(element, this.params);
	}

	static addStructure(
		structure: string,
		weight: number,
		position?: number
	): StructureSetAction<{ structure: string; weight: number; position?: number }> {
		return new StructureSetAction(
			{ structure, weight, position },
			(el, p: { structure: string; weight: number; position?: number }) => {
				const structureSet = structuredClone(el) as StructureSetProps;
				const newStructure: StructureSetStructure = {
					structure: p.structure,
					weight: p.weight
				};

				const structures = [...structureSet.structures];
				if (p.position !== undefined && p.position >= 0 && p.position <= structures.length) {
					structures.splice(p.position, 0, newStructure);
				} else {
					structures.push(newStructure);
				}

				structureSet.structures = structures;
				return structureSet;
			}
		);
	}

	static removeStructure(structureId: string): StructureSetAction<{ structureId: string }> {
		return new StructureSetAction({ structureId }, (el, p: { structureId: string }) => {
			const structureSet = structuredClone(el) as StructureSetProps;
			structureSet.structures = structureSet.structures.filter((_, index) => `structure_${index}` !== p.structureId);
			return structureSet;
		});
	}

	static modifyStructure(
		structureId: string,
		property: "structure" | "weight",
		value: string | number
	): StructureSetAction<{ structureId: string; property: "structure" | "weight"; value: string | number }> {
		return new StructureSetAction(
			{ structureId, property, value },
			(el, p: { structureId: string; property: "structure" | "weight"; value: string | number }) => {
				const structureSet = structuredClone(el) as StructureSetProps;
				const index = Number.parseInt(p.structureId.replace("structure_", ""), 10);
				if (Number.isNaN(index) || index < 0 || index >= structureSet.structures.length) {
					return structureSet;
				}

				const structures = [...structureSet.structures];
				structures[index] = {
					...structures[index],
					[p.property]: p.value
				} as StructureSetStructure;

				structureSet.structures = structures;
				return structureSet;
			}
		);
	}

	static setPlacementType(placementType: PlacementType): StructureSetAction<{ placementType: PlacementType }> {
		return new StructureSetAction({ placementType }, (el, p: { placementType: PlacementType }) => {
			const structureSet = structuredClone(el) as StructureSetProps;
			structureSet.placementType = p.placementType;
			return structureSet;
		});
	}

	static configurePlacement(config: {
		salt?: number;
		frequencyReductionMethod?: FrequencyReductionMethod;
		frequency?: number;
		locateOffset?: [number, number, number];
	}): StructureSetAction<typeof config> {
		return new StructureSetAction(config, (el, p: typeof config) => {
			const structureSet = structuredClone(el) as StructureSetProps;
			if (p.salt !== undefined) structureSet.salt = p.salt;
			if (p.frequencyReductionMethod !== undefined) {
				structureSet.frequencyReductionMethod = p.frequencyReductionMethod;
			}
			if (p.frequency !== undefined) structureSet.frequency = p.frequency;
			if (p.locateOffset !== undefined) structureSet.locateOffset = p.locateOffset;
			return structureSet;
		});
	}

	static setExclusionZone(otherSet: string, chunkCount: number): StructureSetAction<{ otherSet: string; chunkCount: number }> {
		return new StructureSetAction({ otherSet, chunkCount }, (el, p: { otherSet: string; chunkCount: number }) => {
			const structureSet = structuredClone(el) as StructureSetProps;
			structureSet.exclusionZone = {
				otherSet: p.otherSet,
				chunkCount: p.chunkCount
			};
			return structureSet;
		});
	}

	static removeExclusionZone(): StructureSetAction<{}> {
		return new StructureSetAction({}, (el) => {
			const structureSet = structuredClone(el) as StructureSetProps;
			structureSet.exclusionZone = undefined;
			return structureSet;
		});
	}

	static configureConcentricRings(config: {
		distance?: number;
		spread?: number;
		count?: number;
		preferredBiomes?: string[];
	}): StructureSetAction<typeof config> {
		return new StructureSetAction(config, (el, p: typeof config) => {
			const structureSet = structuredClone(el) as StructureSetProps;
			if (p.distance !== undefined) structureSet.distance = p.distance;
			if (p.spread !== undefined) structureSet.spread = p.spread;
			if (p.count !== undefined) structureSet.count = p.count;
			if (p.preferredBiomes !== undefined) structureSet.preferredBiomes = p.preferredBiomes;
			return structureSet;
		});
	}

	static configureRandomSpread(config: {
		spacing?: number;
		separation?: number;
		spreadType?: SpreadType;
	}): StructureSetAction<typeof config> {
		return new StructureSetAction(config, (el, p: typeof config) => {
			const structureSet = structuredClone(el) as StructureSetProps;
			if (p.spacing !== undefined) structureSet.spacing = p.spacing;
			if (p.separation !== undefined) structureSet.separation = p.separation;
			if (p.spreadType !== undefined) structureSet.spreadType = p.spreadType;
			return structureSet;
		});
	}

	static reorderStructures(structureIds: string[]): StructureSetAction<{ structureIds: string[] }> {
		return new StructureSetAction({ structureIds }, (el, p: { structureIds: string[] }) => {
			const structureSet = structuredClone(el) as StructureSetProps;
			const reordered = p.structureIds
				.map((id) => {
					const index = Number.parseInt(id.replace("structure_", ""), 10);
					return structureSet.structures[index];
				})
				.filter((structure): structure is StructureSetStructure => Boolean(structure));

			structureSet.structures = reordered;
			return structureSet;
		});
	}
}
