import type { DatapackFiles, MigrationContext } from "@/types";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function createContext(files: DatapackFiles, warnings: string[], force: boolean): MigrationContext {
	return {
		force,
		transform(pattern, transformer) {
			for (const path of Object.keys(files)) {
				if (!pattern.test(path)) continue;

				const content = decoder.decode(files[path]);
				const result = transformer(content, path);

				if (result !== undefined) {
					files[path] = encoder.encode(result);
				}
			}
		},
		deleteFile(path) {
			delete files[path];
		},
		renameFile(from, to) {
			if (files[from]) {
				files[to] = files[from];
				delete files[from];
			}
		},
		hasFile(path) {
			return path in files;
		},
		getFiles(pattern) {
			return Object.keys(files).filter((path) => pattern.test(path));
		},
		warn(message) {
			warnings.push(message);
		},
	};
}
