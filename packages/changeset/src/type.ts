export type Bump = "major" | "minor" | "patch";
export type DependencyField = "dependencies" | "devDependencies" | "peerDependencies" | "optionalDependencies";

export interface PackageJson {
	name?: string;
	version?: string;
	private?: boolean;
	workspaces?: string[] | { packages?: string[] };
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	peerDependencies?: Record<string, string>;
	optionalDependencies?: Record<string, string>;
	[key: string]: unknown;
}

export interface Package {
	name: string;
	version: string;
	private: boolean;
	dir: string;
	manifest: PackageJson;
	indent: string;
}

export interface Workspace {
	root: string;
	pnpm: boolean;
	packages: Package[];
}

export interface Changeset {
	id: string;
	releases: { name: string; type: Bump }[];
	summary: string;
}

export interface Release {
	name: string;
	type: Bump;
	oldVersion: string;
	newVersion: string;
	/** Ids of the changesets that release this package directly. */
	changesets: string[];
	/** Released internal dependencies (dev dependencies excluded). */
	dependencies: string[];
}
