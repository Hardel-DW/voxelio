import { downloadZip, type InputWithMeta } from "@voxelio/zip";
import type { ModMetadata } from "@/types";

export const createTestMetadata = (overrides?: Partial<ModMetadata>): ModMetadata => ({
	id: "test_mod",
	version: "1.0.0",
	name: "Test Mod",
	description: "A test mod for unit testing",
	authors: [],
	icon: undefined,
	homepage: "",
	issues: "",
	sources: "",
	...overrides
});

/**
 * Create a basic datapack zip with pack.mcmeta
 */
export async function createDatapackZip(filesRecord: Record<string, string>): Promise<File> {
	const files: InputWithMeta[] = Object.entries(filesRecord).map(([path, content]) => ({
		name: path,
		input: new File([content], path)
	}));
	const zipContent = downloadZip(files);
	const buffer = await zipContent.arrayBuffer();
	return new File([buffer], "test_datapack.zip");
}
