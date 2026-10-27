import type { Package } from "@/type";
import { exec } from "@/utils/exec";
import { getWorkspace, sortTopologically } from "@/utils/workspace";

/**
 * Publishes, dependencies first, every public package whose version is missing from the registry,
 * then tags it `name@version`. `publishConfig` (access, tag, registry) is read by the package manager.
 * Returns `false` when a publish failed.
 */
export async function publish(root: string): Promise<boolean> {
	const { packages, pnpm } = await getWorkspace(root);
	const candidates = sortTopologically(packages.filter((pkg) => !pkg.private));
	const published = await Promise.all(candidates.map(isPublished));
	const pending = candidates.filter((_, index) => !published[index]);
	if (pending.length === 0) {
		console.log("Every package is already published");
		return true;
	}

	let success = true;
	for (const pkg of pending) {
		const id = `${pkg.name}@${pkg.version}`;
		const { code } = await exec(pnpm ? "pnpm" : "npm", pnpm ? ["publish", "--no-git-checks"] : ["publish"], pkg.dir, true);
		if (code !== 0) {
			console.error(`Failed to publish ${id}`);
			success = false;
			continue;
		}
		await exec("git", ["tag", id], root);
		console.log(`Published ${id}`);
	}
	return success;
}

async function isPublished(pkg: Package): Promise<boolean> {
	const { code, stdout, stderr } = await exec("npm", ["view", `${pkg.name}@${pkg.version}`, "version"], pkg.dir);
	if (code === 0) return stdout !== "";
	if (stderr.includes("E404")) return false;
	throw new Error(`Unable to check ${pkg.name}@${pkg.version} on the registry\n${stderr}`);
}
