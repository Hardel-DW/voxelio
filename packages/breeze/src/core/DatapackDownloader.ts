import { downloadZip } from "@voxelio/zip";
import type { InputWithoutMeta } from "@voxelio/zip";
import type { Logger } from "@/core/engine/migrations/logger";

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

	async download(logger?: Logger): Promise<Response> {
		const files: InputWithoutMeta[] = Object.entries(this.files).map(([path, data]) => this.prepareFile(path, data));
		if (logger) {
			for (const { path, content } of logger.toFileEntries()) {
				files.push(this.prepareFile(path, content));
			}
		}
		return downloadZip(files);
	}

	private prepareFile(path: string, data: object | string | Uint8Array<ArrayBufferLike>): InputWithoutMeta {
		const input =
			data instanceof Uint8Array ? data : new TextEncoder().encode(typeof data === "string" ? data : JSON.stringify(data, null, 4));

		return {
			name: path,
			input: new ReadableStream({
				start(controller) {
					controller.enqueue(input);
					controller.close();
				}
			})
		};
	}
}
