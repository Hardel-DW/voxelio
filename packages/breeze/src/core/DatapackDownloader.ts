import { downloadZip } from "@voxelio/zip";
import type { InputWithoutMeta } from "@voxelio/zip";
import type { Logger } from "@/core/engine/migrations/logger";
import { Differ } from "@voxelio/diff";
import type { FileStatus } from "./FileStatusComparator";

export class DatapackDownloader {
	constructor(private readonly files: Record<string, Uint8Array<ArrayBufferLike>>) {}

	static getFileName(filename: string, isModded: boolean): string {
		const nameWithoutExtension = filename.replace(/\.(zip|jar)$/, "");
		const versionMatch = nameWithoutExtension.match(/^V(\d+)-/);
		const fileVersion = versionMatch?.[1] ? +versionMatch[1] + 1 : 0;
		const extension = isModded ? ".jar" : ".zip";

		if (nameWithoutExtension.startsWith("V")) {
			return nameWithoutExtension.replace(/^V\d+-/, `V${fileVersion}-`) + extension;
		}
		return `V0-${nameWithoutExtension}${extension}`;
	}

	async download(logger?: Logger, isJar = false): Promise<Response> {
		const files: InputWithoutMeta[] = Object.entries(this.files).map(([path, data]) => this.prepareFile(path, data));
		if (logger) {
			for (const { path, content } of logger.toFileEntries()) {
				files.push(this.prepareFile(path, content));
			}
		}
		// Enable Forge/JAR compatibility mode by disabling data descriptors for STORED entries
		return downloadZip(files, { noDataDescriptorForStored: isJar });
	}

	/**
	 * Compare the original files to the current files and return the map of the paths and the status.
	 */
	getDiff(originalFiles: Record<string, Uint8Array>): Map<string, FileStatus> {
		const result = new Map<string, FileStatus>();
		const decoder = new TextDecoder();
		const originalPaths = new Set(Object.keys(originalFiles));
		const currentPaths = new Set(Object.keys(this.files));
		const allPaths = new Set([...originalPaths, ...currentPaths]);

		for (const path of allPaths) {
			const existsInOriginal = originalPaths.has(path);
			const existsInCurrent = currentPaths.has(path);

			if (!existsInOriginal && existsInCurrent) {
				result.set(path, "added");
				continue;
			}

			if (existsInOriginal && !existsInCurrent) {
				result.set(path, "deleted");
				continue;
			}

			if (!path.endsWith(".json")) {
				const original = originalFiles[path];
				const current = this.files[path];
				if (original.length !== current.length || !original.every((byte, i) => byte === current[i])) {
					result.set(path, "updated");
				}
				continue;
			}

			const originalJson = JSON.parse(decoder.decode(originalFiles[path]));
			const currentJson = JSON.parse(decoder.decode(this.files[path]));
			const patch = new Differ(originalJson, currentJson).diff();
			if (patch.length > 0) {
				result.set(path, "updated");
			}
		}

		return result;
	}

	private prepareFile(path: string, data: Uint8Array<ArrayBufferLike>): InputWithoutMeta {
		return {
			name: path,
			input: new ReadableStream({
				start(controller) {
					controller.enqueue(data);
					controller.close();
				}
			})
		};
	}
}
