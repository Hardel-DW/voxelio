import { cancel, intro, isCancel, multiselect, outro, select, text } from "@clack/prompts";
import type { Bump, Changeset } from "@/type";
import { CHANGESET_DIR, writeChangeset } from "@/utils/changeset";
import { getWorkspace } from "@/utils/workspace";

/** Prompts for the packages, their bump and a summary, then writes the changeset. */
export async function add(root: string): Promise<void> {
	const { packages } = await getWorkspace(root);
	if (packages.length === 0) throw new Error("No package found");
	intro("New changeset");

	const names =
		packages.length === 1
			? [packages[0].name]
			: await multiselect({
					message: "Packages to release",
					options: packages.map((pkg) => ({ value: pkg.name, label: pkg.name, hint: pkg.version })),
					required: true
				});
	if (isCancel(names)) return cancel("No changeset created");

	const releases: Changeset["releases"] = [];
	for (const name of names) {
		const type = await select<Bump>({
			message: `Bump of ${name}`,
			options: [
				{ value: "patch", label: "patch" },
				{ value: "minor", label: "minor" },
				{ value: "major", label: "major" }
			]
		});
		if (isCancel(type)) return cancel("No changeset created");
		releases.push({ name, type });
	}

	const summary = await text({ message: "Summary", validate: (value) => (value?.trim() ? undefined : "Required") });
	if (isCancel(summary)) return cancel("No changeset created");

	const id = await writeChangeset(root, releases, summary);
	outro(`Created ${CHANGESET_DIR}/${id}.md`);
}
