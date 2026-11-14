import { existsSync, globSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { ROOT } from "./path";

export type Entry = { id: string; file: string };

export const PAGES_DIR = "src/pages";
const TYPES_FILE = "node_modules/.voxelio/routes.d.ts";

const posix = (path: string): string => path.replaceAll("\\", "/");
const quote = (value: string): string => JSON.stringify(value);

/** `posts/index.tsx` is `/posts/`, `posts/$id.tsx` is `/posts/$id`, `__root.tsx` stays `__root`. */
export function routeId(file: string): string {
	const path = posix(file).replace(/\.tsx$/, "");
	if (path === ROOT) return ROOT;
	return `/${path}`.replace(/\/index$/, "/");
}

/** Every `.tsx` of the directory is a route, `file` is relative to the root of the project. */
export function scan(root: string, directory: string = PAGES_DIR): Entry[] {
	const files = globSync("**/*.tsx", { cwd: join(root, directory) })
		.map(posix)
		.toSorted();

	return files.map((file) => ({ id: routeId(file), file: `${posix(directory)}/${file}` }));
}

/** The module behind `@voxelio/router/routes`: one lazy import per route. */
export function manifestCode(entries: Entry[]): string {
	const lines = entries.map(({ id, file }) => `\t${quote(id)}: () => import(${quote(`/${file}`)})`);
	return ["export const routes = {", lines.join(",\n"), "};", ""].join("\n");
}

/**
 * The manifest while serving. It lets React Refresh take a page whose `route` changed,
 * and accepts its own updates for the pages that cannot be refreshed in place.
 */
export function hotManifestCode(entries: Entry[], pages: string): string {
	return [
		'import { reloadRoutes } from "@voxelio/router";',
		`window.__getReactRefreshIgnoredExports = ({ id }) => (id.startsWith(${quote(`${pages}/`)}) ? ["route"] : []);`,
		manifestCode(entries),
		"if (import.meta.hot) import.meta.hot.accept((next) => next && reloadRoutes(next.routes));",
		""
	].join("\n");
}

/** Appended to a page while serving: its new `route` reaches the router as soon as the file is saved. */
export function hotPageCode(id: string): string {
	return [
		"",
		'import { reloadRoute as __reloadRoute } from "@voxelio/router";',
		`if (import.meta.hot) import.meta.hot.accept((next) => next && __reloadRoute(${quote(id)}, next.route));`,
		""
	].join("\n");
}

/** Only types: each route is inferred from its own file, nothing else is generated. */
export function typesCode(root: string, entries: Entry[]): string {
	const from = dirname(join(root, TYPES_FILE));
	const lines = entries.map(({ id, file }) => {
		const path = posix(relative(from, join(root, file))).replace(/\.tsx$/, "");
		return `\t\t\t${quote(id)}: () => Promise<typeof import(${quote(path)})>;`;
	});

	return [
		"// Written by @voxelio/router from the routes directory.",
		'declare module "@voxelio/router" {',
		"\tinterface Register {",
		"\t\troutes: {",
		...lines,
		"\t\t};",
		"\t}",
		"}",
		"export {};",
		""
	].join("\n");
}

/** Left untouched when nothing changed, so the type checker has nothing to redo. */
export function writeTypes(root: string, entries: Entry[]): void {
	const file = join(root, TYPES_FILE);
	const code = typesCode(root, entries);
	if (existsSync(file) && readFileSync(file, "utf8") === code) return;

	mkdirSync(dirname(file), { recursive: true });
	writeFileSync(file, code);
}
