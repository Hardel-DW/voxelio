import { decompress } from "@/compression";
import { NbtReader, readRootName } from "@/reader";
import type { NbtCompound, NbtTag } from "@/types";
import { type Compression, Endian, NbtType } from "@/types";

export interface LazyReadOptions {
	endian?: Endian;
	compression?: Compression;
	bedrockHeader?: number;
}

interface FieldInfo {
	type: NbtType;
	start: number;
}

export class LazyNbtFile {
	private readonly data: Uint8Array;
	private readonly endian: Endian;
	private readonly parsedFields = new Map<string, NbtTag>();
	private index: Map<string, FieldInfo> | undefined;
	private name = "";

	constructor(data: Uint8Array, options: LazyReadOptions = {}) {
		this.data = decompress(data, options.compression).subarray(options.bedrockHeader ?? 0);
		this.endian = options.endian ?? Endian.Big;
	}

	/** Root tag name */
	get rootName(): string {
		this.fields();
		return this.name;
	}

	/** Index of top-level field locations, built once by skipping over values without parsing them. */
	private fields(): Map<string, FieldInfo> {
		if (this.index) {
			return this.index;
		}

		const index = new Map<string, FieldInfo>();
		const reader = new NbtReader(this.data, this.endian);
		const name = readRootName(reader);
		for (;;) {
			const type = reader.readU8() as NbtType;
			if (type === NbtType.End) {
				break;
			}
			const fieldName = reader.readString();
			index.set(fieldName, { type, start: reader.cursor });
			reader.skipTag(type);
		}

		this.name = name;
		this.index = index;
		return index;
	}

	/** Get a specific field, parsing only when needed. Returns cached value if already parsed. */
	get(fieldName: string): NbtTag | undefined {
		const cached = this.parsedFields.get(fieldName);
		if (cached) {
			return cached;
		}

		const fieldInfo = this.fields().get(fieldName);
		if (!fieldInfo) {
			return undefined;
		}

		const reader = new NbtReader(this.data, this.endian);
		reader.cursor = fieldInfo.start;
		const value = reader.readTag(fieldInfo.type);
		this.parsedFields.set(fieldName, value);
		return value;
	}

	/** Check if field exists without parsing */
	has(fieldName: string): boolean {
		return this.fields().has(fieldName);
	}

	/** Get all field names without parsing values */
	keys(): string[] {
		return [...this.fields().keys()];
	}

	/** Get multiple fields at once */
	getMany(fieldNames: readonly string[]): Map<string, NbtTag> {
		const result = new Map<string, NbtTag>();
		for (const name of fieldNames) {
			const value = this.get(name);
			if (value) {
				result.set(name, value);
			}
		}
		return result;
	}

	/** Convert to full NbtCompound, in file order. Parses all remaining fields. */
	toCompound(): NbtCompound {
		const entries = new Map<string, NbtTag>();
		for (const name of this.fields().keys()) {
			const value = this.get(name);
			if (value) {
				entries.set(name, value);
			}
		}

		return { type: NbtType.Compound, entries };
	}

	/** Clear parsed cache to free memory */
	clearCache(): void {
		this.parsedFields.clear();
	}
}
