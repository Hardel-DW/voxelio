import { glob, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { DependencyField, Package, PackageJson, Workspace } from "@/type";

const RUNTIME_FIELDS: DependencyField[] = ["dependencies", "peerDependencies", "optionalDependencies"];

/** Packages of the pnpm or npm workspace rooted at `root`, or the root package itself when it is not a workspace. */
export async function getWorkspace(root: string): Promise<Workspace> {
	const pnpmWorkspace = await readFile(join(root, "pnpm-workspace.yaml"), "utf-8").catch(() => null);
	const rootPackage = await readPackage(root);
	const workspaces = rootPackage?.manifest.workspaces;
	const patterns =
		pnpmWorkspace !== null ? parsePnpmWorkspace(pnpmWorkspace) : Array.isArray(workspaces) ? workspaces : workspaces?.packages;
	const pnpm =
		pnpmWorkspace !== null ||
		(await readFile(join(root, "pnpm-lock.yaml")).then(
			() => true,
			() => false
		));

	if (!patterns) return { root, pnpm, packages: rootPackage ? [rootPackage] : [] };

	const dirs: string[] = [];
	for await (const file of glob(
		patterns.map((pattern) => `${pattern}/package.json`),
		{ cwd: root, exclude: (path) => path.includes("node_modules") }
	)) {
		dirs.push(join(root, dirname(file)));
	}

	const packages = await Promise.all(dirs.toSorted().map(readPackage));
	return { root, pnpm, packages: packages.filter((pkg) => pkg !== null) };
}

export async function writePackage(pkg: Package): Promise<void> {
	await writeFile(join(pkg.dir, "package.json"), `${JSON.stringify(pkg.manifest, null, pkg.indent)}\n`, "utf-8");
}

/** Names of the given packages that `pkg` depends on, dev dependencies excluded. */
export function internalDependencies(pkg: Package, names: { has(name: string): boolean }): string[] {
	return [...new Set(RUNTIME_FIELDS.flatMap((field) => Object.keys(pkg.manifest[field] ?? {})))].filter((name) => names.has(name));
}

/** Orders packages so that each one comes after the internal packages it depends on. */
export function sortTopologically(packages: Package[]): Package[] {
	const byName = new Map(packages.map((pkg) => [pkg.name, pkg]));
	const seen = new Set<Package>();
	const sorted: Package[] = [];
	const visit = (pkg: Package): void => {
		if (seen.has(pkg)) return;
		seen.add(pkg);
		for (const name of internalDependencies(pkg, byName)) {
			const dependency = byName.get(name);
			if (dependency) visit(dependency);
		}
		sorted.push(pkg);
	};
	for (const pkg of packages) visit(pkg);
	return sorted;
}

async function readPackage(dir: string): Promise<Package | null> {
	const content = await readFile(join(dir, "package.json"), "utf-8").catch(() => null);
	if (content === null) return null;

	const manifest = JSON.parse(content) as PackageJson;
	if (!manifest.name || !manifest.version) return null;
	const indent = /^([ \t]+)"/m.exec(content)?.[1] ?? "\t";
	return { name: manifest.name, version: manifest.version, private: manifest.private === true, dir, manifest, indent };
}

/** Reads the `packages:` list of a pnpm-workspace.yaml, negated patterns are not supported. */
function parsePnpmWorkspace(content: string): string[] {
	const lines = content.split(/\r?\n/);
	const start = lines.findIndex((line) => line.startsWith("packages:"));
	if (start === -1) return [];

	const patterns: string[] = [];
	for (const line of lines.slice(start + 1)) {
		const item = /^\s+-\s*["']?([^"'#\s]+)/.exec(line);
		if (!item) break;
		patterns.push(item[1]);
	}
	return patterns;
}
