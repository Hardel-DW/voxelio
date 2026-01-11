import type { MigrationContext } from "@/types";

export function renameIdentifier(
	ctx: MigrationContext,
	oldId: string,
	newId: string,
	filePattern: RegExp = /\.(json|mcfunction)$/,
): void {
	const isTag = oldId.startsWith("#");
	const oldFull = normalize(oldId, isTag);
	const oldShort = toShort(oldId, isTag);
	const newFull = normalize(newId, isTag);

	ctx.transform(filePattern, (content) => {
		if (!content.includes(oldFull) && !content.includes(oldShort)) return undefined;

		return content.replaceAll(oldFull, newFull).replaceAll(oldShort, newFull);
	});
}

function normalize(id: string, isTag: boolean): string {
	const clean = id.startsWith("#") ? id.slice(1) : id;
	const withNamespace = clean.includes(":") ? clean : `minecraft:${clean}`;
	return isTag ? `#${withNamespace}` : withNamespace;
}

function toShort(id: string, isTag: boolean): string {
	const clean = id.startsWith("#") ? id.slice(1) : id;
	const resource = clean.includes(":") ? clean.split(":")[1] : clean;
	return isTag ? `#${resource}` : resource;
}
