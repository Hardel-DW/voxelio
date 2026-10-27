import type { Bump, Changeset, Package, Release } from "@/type";
import { internalDependencies } from "@/utils/workspace";

const ORDER: Bump[] = ["patch", "minor", "major"];

export function bumpVersion(version: string, type: Bump): string {
	const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version);
	if (!match) throw new Error(`Invalid version "${version}"`);
	const [major, minor, patch] = match.slice(1).map(Number);
	if (type === "major") return `${major + 1}.0.0`;
	if (type === "minor") return `${major}.${minor + 1}.0`;
	return `${major}.${minor}.${patch + 1}`;
}

/**
 * Each package gets the highest bump of its changesets. A public package depending on a released one
 * (dev dependencies excluded) is released as a patch: `workspace:*` is published as the exact version.
 */
export function assembleReleasePlan(changesets: Changeset[], packages: Package[]): Release[] {
	const byName = new Map(packages.map((pkg) => [pkg.name, pkg]));
	const bumps = new Map<string, Bump>();
	const sources = new Map<string, string[]>();
	const raise = (name: string, type: Bump): void => {
		const current = bumps.get(name);
		if (!current || ORDER.indexOf(type) > ORDER.indexOf(current)) bumps.set(name, type);
	};

	for (const changeset of changesets) {
		for (const { name, type } of changeset.releases) {
			if (!byName.has(name)) throw new Error(`Changeset "${changeset.id}" releases unknown package "${name}"`);
			raise(name, type);
			sources.set(name, [...(sources.get(name) ?? []), changeset.id]);
		}
	}

	let size = -1;
	while (size !== bumps.size) {
		size = bumps.size;
		for (const pkg of packages) {
			if (!pkg.private && internalDependencies(pkg, bumps).length > 0) raise(pkg.name, "patch");
		}
	}

	return packages.flatMap((pkg) => {
		const type = bumps.get(pkg.name);
		if (!type) return [];
		return {
			name: pkg.name,
			type,
			oldVersion: pkg.version,
			newVersion: bumpVersion(pkg.version, type),
			changesets: sources.get(pkg.name) ?? [],
			dependencies: internalDependencies(pkg, bumps)
		};
	});
}
