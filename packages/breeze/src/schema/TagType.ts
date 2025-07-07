import type { DataDrivenElement } from "@/core/Element";

export type TagRegistry = Record<string, TagType>;

export interface TagType extends DataDrivenElement {
	replace?: boolean;
	values: (string | OptionalTag)[];
}

export type OptionalTag = {
	required: boolean;
	id: string;
};
