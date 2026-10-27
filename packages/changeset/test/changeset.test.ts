import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { version } from "@/commands/version";
import type { Package, Release } from "@/type";
import { insertEntry, renderEntry } from "@/utils/changelog";
import { parseChangeset, stringifyChangeset } from "@/utils/changeset";
import { assembleReleasePlan, bumpVersion } from "@/utils/plan";
import { getWorkspace, sortTopologically } from "@/utils/workspace";

function pkg(name: string, version: string, dependencies: Record<string, string> = {}, isPrivate = false): Package {
	return { name, version, private: isPrivate, dir: name, indent: "\t", manifest: { name, version, dependencies } };
}

describe("parseChangeset", () => {
	it("reads quoted entries and the summary, with CRLF", () => {
		const changeset = parseChangeset("a", '---\r\n"@voxelio/zip": minor\r\nbreeze: patch\r\n---\r\n\r\nLine one\r\nLine two\r\n');
		expect(changeset).toEqual({
			id: "a",
			releases: [
				{ name: "@voxelio/zip", type: "minor" },
				{ name: "breeze", type: "patch" }
			],
			summary: "Line one\nLine two"
		});
	});

	it("round-trips with stringifyChangeset", () => {
		const releases = [{ name: "@scope/a", type: "major" as const }];
		expect(parseChangeset("x", stringifyChangeset(releases, "Summary")).releases).toEqual(releases);
	});

	it("rejects invalid bumps", () => {
		expect(() => parseChangeset("a", '---\n"pkg": huge\n---\n')).toThrow('invalid line ""pkg": huge"');
	});
});

describe("bumpVersion", () => {
	it("bumps each part", () => {
		expect(bumpVersion("1.2.3", "patch")).toBe("1.2.4");
		expect(bumpVersion("1.2.3", "minor")).toBe("1.3.0");
		expect(bumpVersion("1.2.3", "major")).toBe("2.0.0");
	});
});

describe("assembleReleasePlan", () => {
	const packages = [
		pkg("diff", "1.0.0"),
		pkg("breeze", "1.5.0", { diff: "workspace:*" }),
		pkg("converter", "2.0.0", { breeze: "workspace:*" }),
		pkg("example", "0.0.1", { converter: "workspace:*" }, true),
		pkg("zip", "3.0.0")
	];

	it("keeps the highest bump and cascades patches to public dependents", () => {
		const releases = assembleReleasePlan(
			[
				{ id: "a", releases: [{ name: "diff", type: "patch" }], summary: "A" },
				{ id: "b", releases: [{ name: "diff", type: "minor" }], summary: "B" }
			],
			packages
		);
		expect(releases.map(({ name, newVersion, changesets, dependencies }) => ({ name, newVersion, changesets, dependencies }))).toEqual([
			{ name: "diff", newVersion: "1.1.0", changesets: ["a", "b"], dependencies: [] },
			{ name: "breeze", newVersion: "1.5.1", changesets: [], dependencies: ["diff"] },
			{ name: "converter", newVersion: "2.0.1", changesets: [], dependencies: ["breeze"] }
		]);
	});

	it("rejects unknown packages", () => {
		expect(() => assembleReleasePlan([{ id: "a", releases: [{ name: "nope", type: "patch" }], summary: "" }], packages)).toThrow(
			"unknown package"
		);
	});
});

describe("changelog", () => {
	const diff: Release = { name: "diff", type: "minor", oldVersion: "1.0.0", newVersion: "1.1.0", changesets: ["a"], dependencies: [] };
	const breeze: Release = {
		name: "breeze",
		type: "patch",
		oldVersion: "1.5.0",
		newVersion: "1.5.1",
		changesets: ["b"],
		dependencies: ["diff"]
	};
	const changesets = new Map([
		["a", { id: "a", releases: [{ name: "diff", type: "minor" as const }], summary: "New API" }],
		["b", { id: "b", releases: [{ name: "breeze", type: "patch" as const }], summary: "Fix\nDetails" }]
	]);
	const releases = new Map([
		["diff", diff],
		["breeze", breeze]
	]);

	it("renders the changesets format", () => {
		expect(renderEntry(breeze, changesets, releases, new Map([["a", "abc1234"]]))).toBe(
			"## 1.5.1\n\n### Patch Changes\n\n- Fix\n  Details\n- Updated dependencies [abc1234]\n  - diff@1.1.0\n"
		);
	});

	it("inserts below the title or creates the file", () => {
		expect(insertEntry(null, "diff", "## 1.1.0\n")).toBe("# diff\n\n## 1.1.0\n");
		expect(insertEntry("# diff\n\n## 1.0.0\n", "diff", "## 1.1.0\n")).toBe("# diff\n\n## 1.1.0\n\n## 1.0.0\n");
	});
});

describe("workspace", () => {
	let root: string;

	beforeEach(async () => {
		root = await mkdtemp(join(tmpdir(), "voxelio-changeset-"));
		await writeFile(join(root, "pnpm-workspace.yaml"), "packages:\n  - packages/*\n  - 'examples/*'\n");
		await writeFile(join(root, "package.json"), '{ "private": true }\n');
		const write = async (dir: string, manifest: object): Promise<void> => {
			await mkdir(join(root, dir), { recursive: true });
			await writeFile(join(root, dir, "package.json"), `${JSON.stringify(manifest, null, "  ")}\n`);
		};
		await write("packages/diff", { name: "diff", version: "1.0.0" });
		await write("packages/breeze", { name: "breeze", version: "1.5.0", dependencies: { diff: "workspace:*" } });
		await write("examples/app", { name: "app", version: "0.0.1", private: true, dependencies: { breeze: "workspace:*" } });
		await mkdir(join(root, ".changeset"));
		await writeFile(join(root, ".changeset", "config.json"), "{}");
		await writeFile(join(root, ".changeset", "happy-cats-run.md"), '---\n"diff": minor\n---\n\nNew API\n');
	});

	afterEach(async () => {
		await rm(root, { recursive: true, force: true });
	});

	it("discovers packages and sorts them by dependency", async () => {
		const { packages, pnpm } = await getWorkspace(root);
		expect(pnpm).toBe(true);
		expect(sortTopologically(packages.toReversed()).map((p) => p.name)).toEqual(["diff", "breeze", "app"]);
	});

	it("versions packages, writes changelogs and consumes changesets", async () => {
		await version(root);

		const breeze = JSON.parse(await readFile(join(root, "packages/breeze/package.json"), "utf-8"));
		expect(breeze).toEqual({ name: "breeze", version: "1.5.1", dependencies: { diff: "workspace:*" } });
		expect(await readFile(join(root, "packages/breeze/package.json"), "utf-8")).toContain('\n  "version"');
		expect(await readFile(join(root, "packages/diff/CHANGELOG.md"), "utf-8")).toBe(
			"# diff\n\n## 1.1.0\n\n### Minor Changes\n\n- New API\n"
		);
		expect(await readFile(join(root, "packages/breeze/CHANGELOG.md"), "utf-8")).toBe(
			"# breeze\n\n## 1.5.1\n\n### Patch Changes\n\n- Updated dependencies\n  - diff@1.1.0\n"
		);
		expect(JSON.parse(await readFile(join(root, "examples/app/package.json"), "utf-8")).version).toBe("0.0.1");
		expect(await readdir(join(root, ".changeset"))).toEqual(["config.json"]);
	});
});
