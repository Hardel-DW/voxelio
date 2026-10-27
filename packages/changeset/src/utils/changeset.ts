import { randomInt } from "node:crypto";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Bump, Changeset } from "@/type";

export const CHANGESET_DIR = ".changeset";

const DOCUMENT = /^---\n([\s\S]*?)\n?---\n?([\s\S]*)$/;
const ENTRY = /^["']?([^"':]+?)["']?\s*:\s*["']?(major|minor|patch)["']?$/;
const WORDS = [
	["brave", "bright", "calm", "clever", "eager", "gentle", "happy", "kind", "lucky", "quick", "quiet", "wild"],
	["bears", "cats", "dragons", "eagles", "foxes", "lions", "owls", "pandas", "rabbits", "tigers", "wolves"],
	["dance", "dream", "fly", "glow", "jump", "play", "rest", "run", "sing", "smile", "swim", "walk"]
];

/** Parses a changeset: a frontmatter of `"package": bump` lines followed by the summary. */
export function parseChangeset(id: string, content: string): Changeset {
	const match = DOCUMENT.exec(content.replace(/\r\n/g, "\n"));
	if (!match) throw new Error(`${CHANGESET_DIR}/${id}.md: missing frontmatter`);

	const releases: Changeset["releases"] = [];
	for (const line of match[1].split("\n").map((raw) => raw.trim())) {
		if (line === "") continue;
		const entry = ENTRY.exec(line);
		if (!entry) throw new Error(`${CHANGESET_DIR}/${id}.md: invalid line "${line}"`);
		releases.push({ name: entry[1], type: entry[2] as Bump });
	}
	return { id, releases, summary: match[2].trim() };
}

export function stringifyChangeset(releases: Changeset["releases"], summary: string): string {
	return `---\n${releases.map(({ name, type }) => `"${name}": ${type}\n`).join("")}---\n\n${summary.trim()}\n`;
}

export async function readChangesets(root: string): Promise<Changeset[]> {
	const files = await readdir(join(root, CHANGESET_DIR)).catch(() => []);
	const ids = files.filter((file) => file.endsWith(".md") && file.toLowerCase() !== "readme.md").map((file) => file.slice(0, -3));
	return Promise.all(ids.toSorted().map(async (id) => parseChangeset(id, await readFile(changesetPath(root, id), "utf-8"))));
}

/** Writes a changeset under a random readable name and returns its id. */
export async function writeChangeset(root: string, releases: Changeset["releases"], summary: string): Promise<string> {
	await mkdir(join(root, CHANGESET_DIR), { recursive: true });
	const existing = new Set(await readdir(join(root, CHANGESET_DIR)));
	let id = randomId();
	while (existing.has(`${id}.md`)) id = randomId();
	await writeFile(changesetPath(root, id), stringifyChangeset(releases, summary), "utf-8");
	return id;
}

export async function removeChangesets(root: string, changesets: Changeset[]): Promise<void> {
	await Promise.all(changesets.map(({ id }) => rm(changesetPath(root, id), { force: true })));
}

export function changesetPath(root: string, id: string): string {
	return join(root, CHANGESET_DIR, `${id}.md`);
}

function randomId(): string {
	return WORDS.map((words) => words[randomInt(words.length)]).join("-");
}
