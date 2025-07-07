import type { IdentifierObject } from "@/core/Identifier";
import type { Analysers, GetAnalyserVoxel } from "@/core/engine/Analyser";

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

export function isRegistryVoxelElement<T extends keyof Analysers>(element: any): element is VoxelRegistryElement<GetAnalyserVoxel<T>> {
	return "identifier" in element && "data" in element && typeof element.identifier === "string";
}

export function isVoxelElement<T extends keyof Analysers>(element: any): element is GetAnalyserVoxel<T> {
	return "identifier" in element;
}

/**
 * Get the identifier from a labeled element
 * @param comp - The labeled element
 * @returns The identifier
 */
export function getLabeledIdentifier(comp: LabeledElement): IdentifierObject {
	return comp.type === "deleted" ? comp.identifier : comp.element.identifier;
}

export type LabeledElement = NewOrUpdated | Deleted;

interface NewOrUpdated {
	type: "new" | "updated";
	element: DataDrivenRegistryElement<DataDrivenElement>;
}

interface Deleted {
	type: "deleted";
	identifier: IdentifierObject;
}
