import { decompress, detectCompression } from "@/compression";
import { NbtError, NbtErrorKind } from "@/error";
import { NbtReader } from "@/reader";
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
	private readonly headerOffset: number;
	private parsedFields: Map<string, NbtTag> = new Map();
	private fieldOffsets: Map<string, FieldInfo> | null = null;
	private _rootName: string | null = null;

	constructor(data: Uint8Array, options: LazyReadOptions = {}) {
		const compression = options.compression ?? detectCompression(data);
		this.data = decompress(data, compression);
		this.endian = options.endian ?? Endian.Big;
		this.headerOffset = options.bedrockHeader ?? 0;
	}

	/** Root tag name */
	get rootName(): string {
		this.buildIndex();
		return this._rootName ?? "";
	}

	/** Build index of field locations without parsing values. Indexes all top-level fields. */
	private buildIndex(): void {
		if (this.fieldOffsets) {
			return;
		}

		this.fieldOffsets = new Map();
		const reader = new NbtReader(this.headerOffset > 0 ? this.data.subarray(this.headerOffset) : this.data, this.endian);

		const rootType = reader.readU8();
		if (rootType !== NbtType.Compound) {
			throw new NbtError(`Root must be compound, got ${rootType}`, NbtErrorKind.InvalidData);
		}

		this._rootName = reader.readString();

		for (;;) {
			const tagType = reader.readU8() as NbtType;
			if (tagType === NbtType.End) {
				break;
			}

			const name = reader.readString();
			const start = reader.cursor;

			this.fieldOffsets.set(name, { type: tagType, start });
			reader.skipTag(tagType);
		}
	}

	/** Get a specific field, parsing only when needed. Returns cached value if already parsed. */
	get(fieldName: string): NbtTag | undefined {
		const cached = this.parsedFields.get(fieldName);
		if (cached) {
			return cached;
		}

		this.buildIndex();
		const fieldInfo = this.fieldOffsets?.get(fieldName);
		if (!fieldInfo) {
			return undefined;
		}

		const reader = new NbtReader(this.headerOffset > 0 ? this.data.subarray(this.headerOffset) : this.data, this.endian);
		reader.cursor = fieldInfo.start;
		const value = reader.readTag(fieldInfo.type);

		this.parsedFields.set(fieldName, value);
		return value;
	}

	/** Check if field exists without parsing */
	has(fieldName: string): boolean {
		this.buildIndex();
		return this.fieldOffsets?.has(fieldName) ?? false;
	}

	/** Get all field names without parsing values */
	keys(): string[] {
		this.buildIndex();
		return this.fieldOffsets ? [...this.fieldOffsets.keys()] : [];
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

	/** Convert to full NbtCompound. Parses all remaining fields. */
	toCompound(): NbtCompound {
		this.buildIndex();

		if (!this.fieldOffsets) {
			return { type: NbtType.Compound, entries: new Map() };
		}

		for (const name of this.fieldOffsets.keys()) {
			if (!this.parsedFields.has(name)) {
				this.get(name);
			}
		}

		return { type: NbtType.Compound, entries: new Map(this.parsedFields) };
	}

	/** Clear parsed cache to free memory */
	clearCache(): void {
		this.parsedFields.clear();
	}
}
