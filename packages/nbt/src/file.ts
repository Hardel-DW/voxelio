import { compress, type CompressOptions, decompress, detectCompression } from "@/compression";
import { isCompound, isList, isNumeric, isString } from "@/guards";
import { NbtReader, readRootName } from "@/reader";
import type { NbtCompound, NbtList, NbtTag } from "@/types";
import { Compression, Endian, NbtType } from "@/types";
import { NbtWriter } from "@/writer";

/** Size of the Bedrock level.dat header: int32 version + int32 payload length, both little endian. */
const BEDROCK_HEADER_SIZE = 8;

export interface ReadOptions {
	/** Only parse these top-level fields, skip others */
	fields?: readonly string[];
	/** Endianness (defaults to Big/Java) */
	endian?: Endian;
	/** Override compression detection */
	compression?: Compression;
	/** Bedrock header size in bytes to skip (8 for level.dat). Its version is kept in `NbtFile.bedrockHeader`. */
	bedrockHeader?: number;
}

export interface WriteOptions {
	compression?: Compression;
	/** Compression level 1-9 (1=fastest, 9=best). Default: 6 */
	compressionLevel?: CompressOptions["level"];
	endian?: Endian;
	/** Bedrock header version; when set, an 8-byte Bedrock header is written. */
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
		const headerSize = options.bedrockHeader ?? 0;
		const bedrockVersion = headerSize >= 4 ? new NbtReader(decompressed, Endian.Little).readI32() : undefined;
		const reader = new NbtReader(decompressed.subarray(headerSize), endian);
		const name = readRootName(reader);
		const root = options.fields?.length ? reader.readCompoundSelective(new Set(options.fields)) : reader.readCompound();
		return new NbtFile(name, root, compression, endian, bedrockVersion);
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
		const writer = new NbtWriter(endian);
		if (bedrockHeader !== undefined) {
			writer.writeBytes(new Uint8Array(BEDROCK_HEADER_SIZE));
		}

		writer.writeU8(NbtType.Compound);
		writer.writeString(this.name);
		writer.writeTag(this.root);

		const result = writer.getData();
		if (bedrockHeader !== undefined) {
			const view = new DataView(result.buffer, result.byteOffset, result.byteLength);
			view.setInt32(0, bedrockHeader, true);
			view.setInt32(4, result.length - BEDROCK_HEADER_SIZE, true);
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
		return tag && isString(tag) ? tag.value : "";
	}

	getNumber(key: string): number {
		const tag = this.get(key);
		if (!tag || !isNumeric(tag)) {
			return 0;
		}

		return tag.type === NbtType.Long ? Number(tag.value) : tag.value;
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
