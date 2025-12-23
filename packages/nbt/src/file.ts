import { compress, type CompressOptions, decompress, detectCompression } from "@/compression";
import { NbtError, NbtErrorKind } from "@/error";
import { isCompound, isList, isNumeric, isString } from "@/guards";
import { NbtReader } from "@/reader";
import type { NbtCompound, NbtList, NbtTag } from "@/types";
import { Compression, Endian, NbtType } from "@/types";
import { NbtWriter } from "@/writer";

export interface ReadOptions {
	/** Only parse these top-level fields, skip others */
	fields?: readonly string[];
	/** Endianness (defaults to Big/Java) */
	endian?: Endian;
	/** Override compression detection */
	compression?: Compression;
	/** Bedrock header offset (skip N bytes) */
	bedrockHeader?: number;
}

export interface WriteOptions {
	compression?: Compression;
	/** Compression level 1-9 (1=fastest, 9=best). Default: 6 */
	compressionLevel?: CompressOptions["level"];
	endian?: Endian;
	bedrockHeader?: number;
}

/**
 * High-level NBT file API for reading and writing.
 */
export class NbtFile {
	constructor(
		public name: string,
		public root: NbtCompound,
		public compression: Compression = Compression.None,
		public endian: Endian = Endian.Big,
		public bedrockHeader?: number
	) {}

	static read(data: Uint8Array, options: ReadOptions = {}): NbtFile {
		const compression = options.compression ?? detectCompression(data);
		const decompressed = decompress(data, compression);
		const endian = options.endian ?? Endian.Big;
		const offset = options.bedrockHeader ?? 0;
		const reader = new NbtReader(offset > 0 ? decompressed.subarray(offset) : decompressed, endian);
		const tagType = reader.readU8();

		if (tagType !== NbtType.Compound) {
			throw new NbtError(`Root tag must be compound, got ${tagType}`, NbtErrorKind.InvalidData);
		}

		const name = reader.readString();
		let root: NbtCompound;
		if (options.fields && options.fields.length > 0) {
			const wantedSet = new Set(options.fields);
			root = reader.readCompoundSelective(wantedSet);
		} else {
			root = reader.readCompound();
		}

		return new NbtFile(name, root, compression, endian, options.bedrockHeader);
	}

	/**
	 * Read with selective field parsing - only parse specified fields.
	 * Much faster for large files when you only need specific data.
	 */
	static readSelective(data: Uint8Array, fields: readonly string[], options: ReadOptions = {}): NbtFile {
		return NbtFile.read(data, { ...options, fields });
	}

	/** Write NBT file to bytes */
	write(options: WriteOptions = {}): Uint8Array {
		const endian = options.endian ?? this.endian;
		const compression = options.compression ?? this.compression;
		const bedrockHeader = options.bedrockHeader ?? this.bedrockHeader;
		const writer = new NbtWriter(endian, 1024);

		// Write bedrock header if needed
		if (bedrockHeader !== undefined) {
			writer.writeI32(bedrockHeader); // version (little-endian for bedrock)
			writer.writeI32(0); // length placeholder
		}

		// Write root compound tag
		writer.writeU8(NbtType.Compound);
		writer.writeString(this.name);
		writer.writeTag(this.root);

		// Update bedrock header length if present length in little-endian
		const result = writer.getData();
		if (bedrockHeader !== undefined) {
			const view = new DataView(result.buffer, result.byteOffset, result.byteLength);
			view.setInt32(4, result.length - 8, true);
		}

		return compress(result, compression, { level: options.compressionLevel });
	}

	get(key: string): NbtTag | undefined {
		return this.root.entries.get(key);
	}

	has(key: string): boolean {
		return this.root.entries.has(key);
	}

	set(key: string, value: NbtTag): void {
		this.root.entries.set(key, value);
	}

	delete(key: string): boolean {
		return this.root.entries.delete(key);
	}

	getString(key: string): string {
		const tag = this.get(key);
		if (tag && isString(tag)) {
			return tag.value;
		}
		return "";
	}

	getNumber(key: string): number {
		const tag = this.get(key);
		if (!tag) {
			return 0;
		}
		if (isNumeric(tag)) {
			return tag.type === NbtType.Long ? Number(tag.value) : tag.value;
		}
		return 0;
	}

	getCompound(key: string): NbtCompound | undefined {
		const tag = this.get(key);
		return tag && isCompound(tag) ? tag : undefined;
	}

	getList(key: string): NbtList | undefined {
		const tag = this.get(key);
		return tag && isList(tag) ? tag : undefined;
	}
}
