import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Release } from "@/type";
import { CHANGESET_DIR, readChangesets, removeChangesets } from "@/utils/changeset";
import { insertEntry, renderEntry } from "@/utils/changelog";
import { exec } from "@/utils/exec";
import { assembleReleasePlan } from "@/utils/plan";
import { getWorkspace, writePackage } from "@/utils/workspace";

/** Consumes the changesets: bumps the versions, writes the changelogs and deletes the changeset files. */
export async function version(root: string): Promise<Release[]> {
	const { packages } = await getWorkspace(root);
	const changesets = await readChangesets(root);
	if (changesets.length === 0) {
		console.log("No changesets found");
		return [];
	}

	const releases = assembleReleasePlan(changesets, packages);
	const releasesByName = new Map(releases.map((release) => [release.name, release]));
	const changesetsById = new Map(changesets.map((changeset) => [changeset.id, changeset]));
	const commits = new Map<string, string>();
	for (const { id } of changesets) {
		const { stdout } = await exec(
			"git",
			["log", "--diff-filter=A", "--max-count=1", "--format=%H", "--", `${CHANGESET_DIR}/${id}.md`],
			root
		);
		if (stdout) commits.set(id, stdout.slice(0, 7));
	}

	for (const pkg of packages) {
		const release = releasesByName.get(pkg.name);
		if (!release) continue;

		pkg.manifest.version = release.newVersion;
		const path = join(pkg.dir, "CHANGELOG.md");
		const changelog = await readFile(path, "utf-8").catch(() => null);
		await writeFile(path, insertEntry(changelog, pkg.name, renderEntry(release, changesetsById, releasesByName, commits)), "utf-8");
		await writePackage(pkg);
		console.log(`${pkg.name}: ${release.oldVersion} → ${release.newVersion}`);
	}

	await removeChangesets(root, changesets);
	return releases;
}
