import type { Params } from "./types";

type Pattern = { segments: string[]; layout: boolean; rank: string };

export type Table = { ids: Set<string>; patterns: Pattern[] };
export type Matched = { ids: string[]; params: Params; found: boolean };

export const ROOT = "__root";

const split = (path: string): string[] => path.split("/").filter(Boolean);
const rank = (segment: string): string => (segment === "$" ? "0" : segment.startsWith("$") ? "1" : "2");

function decode(value: string): string {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}

/** Static segments win over params, params over the splat. */
export function compile(ids: string[]): Table {
	const patterns = ids
		.filter((id) => id !== ROOT)
		.map((id) => ({ segments: split(id), layout: ids.some((other) => other.startsWith(`${id}/`)) }))
		.map((pattern) => ({ ...pattern, rank: pattern.segments.map(rank).join("") }))
		.toSorted((a, b) => (a.rank < b.rank ? 1 : a.rank > b.rank ? -1 : 0));

	return { ids: new Set(ids), patterns };
}

function capture(pattern: string[], path: string[]): Params | undefined {
	const splat = pattern.at(-1) === "$";
	if (splat ? path.length < pattern.length : path.length !== pattern.length) return;

	const params: Params = {};
	for (const [position, segment] of pattern.entries()) {
		if (segment === "$") params["*"] = path.slice(position).map(decode).join("/");
		else if (segment.startsWith("$")) params[segment.slice(1)] = decode(path[position]);
		else if (segment !== path[position]) return;
	}

	return params;
}

/** The root, each layout on the way down, then the page and its index. */
function chain(ids: Set<string>, segments: string[], leaf: boolean): string[] {
	const layouts = segments.map((_, position) => `/${segments.slice(0, position + 1).join("/")}`);
	const index = `${layouts.at(-1) ?? ""}/`;
	return [ROOT, ...layouts, ...(leaf ? [index] : [])].filter((id) => ids.has(id));
}

/** Without a page for the path, falls back on the deepest layout that covers its start. */
export function match(table: Table, pathname: string): Matched {
	const path = split(pathname);

	for (let length = path.length; length >= 0; length--) {
		const found = length === path.length;
		const covered = path.slice(0, length);

		for (const pattern of table.patterns) {
			if (!found && !pattern.layout) continue;

			const params = capture(pattern.segments, covered);
			if (params) return { ids: chain(table.ids, pattern.segments, found), params, found };
		}
	}

	return { ids: chain(table.ids, [], false), params: {}, found: false };
}

export function fill(path: string, params: Partial<Params> = {}): string {
	return path.replace(/\$([^/]*)/g, (_, name: string) => (name ? encodeURIComponent(params[name] ?? "") : encodeURI(params["*"] ?? "")));
}
