import type { Analysers, GetAnalyserVoxel } from "@/core/engine/Analyser";
import type { IdentifierObject } from "@/core/Identifier";

export type DataDrivenElement = Record<string, unknown>;
export interface VoxelElement extends Record<string, unknown> {
	override?: ConfiguratorConfigFromDatapack;
	identifier: IdentifierObject;
}

export type VoxelRegistryElement<T extends VoxelElement> = {
	identifier: string;
	data: T;
};

export type DataDrivenRegistryElement<T extends DataDrivenElement> = {
	identifier: IdentifierObject;
	data: T;
};

export type ConfiguratorConfigFromDatapack = {
	configurator: {
		hide: boolean;
	};
};

export const normalizeResourceLocation = (id: string) =>
	id.includes(":") ? id : id.startsWith("#") ? `#minecraft:${id.slice(1)}` : `minecraft:${id}`;

export function isVoxelElement<T extends keyof Analysers>(element: any): element is GetAnalyserVoxel<T> {
	return "identifier" in element;
}

/**
 * Sorts voxel elements by registry and then alphabetically
 * @param elements - Map of voxel elements
 * @returns Map of registry to sorted identifiers
 */
export function sortElementsByRegistry(elements: Map<string, VoxelElement>): Map<string, string[]> {
	const grouped = Map.groupBy(elements, ([, e]) => e.identifier.registry);

	return new Map(
		[...grouped].map(([registry, entries]) => {
			const sortedIds = entries
				.toSorted((a, b) => {
					const nameA = a[1].identifier.resource.split("/").pop() ?? "";
					const nameB = b[1].identifier.resource.split("/").pop() ?? "";
					return nameA.localeCompare(nameB);
				})
				.map(([id]) => id);

			return [registry, sortedIds] as const;
		})
	);
}
