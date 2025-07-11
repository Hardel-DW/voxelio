import type { NbtCompressionMode } from "@/NbtFile";
import { NbtFile } from "@/NbtFile";
import type { NbtCompound } from "@/tags/NbtCompound";
import type { JsonValue } from "@/util/Json";
import { Json } from "@/util/Json";

export type NbtChunkResolver = (x: number, z: number) => Promise<NbtFile>;

export class NbtChunk {
	private file?: NbtFile;
	private dirty: boolean;

	constructor(
		public readonly x: number,
		public readonly z: number,
		public compression: number,
		public timestamp: number,
		private raw: Uint8Array
	) {
		this.dirty = false;
	}

	public getCompression(): NbtCompressionMode {
		switch (this.compression) {
			case 1:
				return "gzip";
			case 2:
				return "zlib";
			case 3:
				return "none";
			default:
				throw new Error(`Invalid compression mode ${this.compression}`);
		}
	}

	public setCompression(compression: NbtCompressionMode) {
		switch (compression) {
			case "gzip":
				this.compression = 1;
				break;
			case "zlib":
				this.compression = 2;
				break;
			case "none":
				this.compression = 3;
				break;
			default:
				throw new Error(`Invalid compression mode ${compression}`);
		}
	}

	public async getFile(): Promise<NbtFile> {
		if (this.file === undefined) {
			this.file = await NbtFile.read(this.raw, {
				compression: this.getCompression()
			});
		}
		return this.file;
	}

	public async getRoot(): Promise<NbtCompound> {
		const file = await this.getFile();
		return file.root;
	}

	public setRoot(root: NbtCompound) {
		if (this.file === undefined) {
			this.file = NbtFile.create({
				compression: this.getCompression()
			});
		}
		this.file.root = root;
		this.markDirty();
	}

	public markDirty() {
		this.dirty = true;
	}

	public async getRaw(): Promise<Uint8Array> {
		if (this.file === undefined || this.dirty === false) {
			return this.raw;
		}
		this.file.compression = this.getCompression();
		const array = await this.file.write();
		this.raw = array;
		this.dirty = false;
		return array;
	}

	public toJson() {
		return {
			x: this.x,
			z: this.z,
			compression: this.compression,
			timestamp: this.timestamp,
			size: this.raw.byteLength
		};
	}

	public toRef(resolver: NbtChunkResolver) {
		return new NbtChunk.Ref(this.x, this.z, this.compression, this.timestamp, this.raw.byteLength, resolver);
	}

	public static async create(x: number, z: number, file: NbtFile, timestamp?: number): Promise<NbtChunk> {
		const raw = await file.write();
		const chunk = new NbtChunk(x, z, 0, timestamp ?? 0, raw);
		chunk.setCompression(file.compression);
		return chunk;
	}

	public static fromJson(value: JsonValue, resolver: NbtChunkResolver) {
		const obj = Json.readObject(value) ?? {};
		const x = Json.readInt(obj.x) ?? 0;
		const z = Json.readInt(obj.z) ?? 0;
		const compression = Json.readNumber(obj.compression) ?? 2;
		const timestamp = Json.readInt(obj.timestamp) ?? 0;
		const size = Json.readInt(obj.size) ?? 0;
		return new NbtChunk.Ref(x, z, compression, timestamp, size, resolver);
	}
}

export namespace NbtChunk {
	export class Ref {
		private file?: Promise<NbtFile> | NbtFile;

		constructor(
			public readonly x: number,
			public readonly z: number,
			public readonly compression: number,
			public readonly timestamp: number,
			public readonly size: number,
			public readonly resolver: NbtChunkResolver
		) {}

		public getFile() {
			if (this.file instanceof NbtFile) {
				return this.file;
			}
			return undefined;
		}

		public getRoot() {
			if (this.file instanceof NbtFile) {
				return this.file.root;
			}
			return undefined;
		}

		public async getFileAsync() {
			if (this.file) {
				return this.file;
			}
			this.file = (async () => {
				const file = await this.resolver(this.x, this.z);
				this.file = file;
				return file;
			})();
			return this.file;
		}

		public async getRootAsync() {
			const file = await this.getFileAsync();
			return file.root;
		}

		public isResolved() {
			return this.file instanceof NbtFile;
		}
	}
}
