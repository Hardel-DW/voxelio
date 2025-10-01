import { downloadZip } from "@voxelio/zip";
import type { InputWithoutMeta } from "@voxelio/zip";
import type { Logger } from "@/core/engine/migrations/logger";

export class DatapackDownloader {
	private readonly fileVersion: number;

	constructor(
		private readonly files: Record<string, Uint8Array<ArrayBufferLike>>,
		private readonly isModded: boolean,
		private readonly filename: string
	) {
		const nameWithoutExtension = this.filename.replace(/\.(zip|jar)$/, "");
		const versionMatch = nameWithoutExtension.match(/^V(\d+)-/);
		this.fileVersion = versionMatch?.[1] ? +versionMatch[1] + 1 : 0;
	}

	getFileName(): string {
		const nameWithoutExtension = this.filename.replace(/\.(zip|jar)$/, "");
		const extension = this.isModded ? ".jar" : ".zip";
		if (nameWithoutExtension.startsWith("V")) {
			return nameWithoutExtension.replace(/^V\d+-/, `V${this.fileVersion}-`) + extension;
		}
		return `V0-${nameWithoutExtension}${extension}`;
	}

	async download(logger: Logger): Promise<Response> {
		const files: InputWithoutMeta[] = Object.entries(this.files).map(([path, data]) => this.prepareFile(path, data));
		if (logger) files.push(this.prepareFile(`voxel/v${this.fileVersion}.json`, logger.exportJson()));
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
