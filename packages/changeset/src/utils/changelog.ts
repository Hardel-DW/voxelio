import type { Bump, Changeset, Release } from "@/type";

const TITLES: [Bump, string][] = [
	["major", "Major Changes"],
	["minor", "Minor Changes"],
	["patch", "Patch Changes"]
];

/** Renders the `## version` entry of a release, in the `@changesets/cli` format. `commits` maps a changeset id to its short hash. */
export function renderEntry(
	release: Release,
	changesets: Map<string, Changeset>,
	releases: Map<string, Release>,
	commits: Map<string, string>
): string {
	const sections = new Map<Bump, string[]>(TITLES.map(([type]) => [type, []]));

	for (const id of release.changesets) {
		const changeset = changesets.get(id);
		if (!changeset?.summary) continue;
		const type = changeset.releases.find((entry) => entry.name === release.name)?.type ?? release.type;
		const [first, ...rest] = changeset.summary.split("\n");
		const hash = commits.get(id);
		sections.get(type)?.push([`- ${hash ? `${hash}: ` : ""}${first}`, ...rest.map((line) => (line ? `  ${line}` : ""))].join("\n"));
	}

	const dependencies = release.dependencies.flatMap((name) => releases.get(name) ?? []);
	if (dependencies.length > 0) {
		const hashes = [...new Set(dependencies.flatMap((dependency) => dependency.changesets.flatMap((id) => commits.get(id) ?? [])))];
		const lines = dependencies.map((dependency) => `  - ${dependency.name}@${dependency.newVersion}`);
		sections
			.get(release.type)
			?.push([`- Updated dependencies${hashes.length > 0 ? ` [${hashes.join(", ")}]` : ""}`, ...lines].join("\n"));
	}

	const body = TITLES.flatMap(([type, title]) => {
		const items = sections.get(type) ?? [];
		return items.length > 0 ? `### ${title}\n\n${items.join("\n")}` : [];
	});
	return `## ${release.newVersion}\n\n${body.join("\n\n")}\n`;
}

/** Inserts the entry right below the `# title`, creating the changelog when needed. */
export function insertEntry(existing: string | null, name: string, entry: string): string {
	const content = existing?.replace(/\r\n/g, "\n") ?? "";
	const title = /^# .*\n+/.exec(content);
	if (!title) return `# ${name}\n\n${entry}${content ? `\n${content}` : ""}`;
	return `${title[0].trimEnd()}\n\n${entry}\n${content.slice(title[0].length)}`;
}
