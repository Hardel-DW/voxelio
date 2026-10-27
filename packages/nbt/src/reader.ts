import { decodeString, toHostOrder } from "@/encoding";
import { NbtError, NbtErrorKind } from "@/error";
import type { NbtCompound, NbtList, NbtTag } from "@/types";
import { Endian, NbtType } from "@/types";

/** Same nesting limit as Minecraft (NbtAccounter). */
const MAX_DEPTH = 512;

/** Minimum encoded size of one element per tag type, used to reject impossible list lengths before allocating. */
const MIN_SIZE = [0, 1, 2, 4, 8, 4, 8, 4, 2, 5, 1, 4, 4];

/**
 * High-performance NBT reader with cursor-based parsing.
 * Supports selective field parsing and skip mechanism for lazy loading.
 */
export class NbtReader {
	private readonly data: Uint8Array;
	private readonly view: DataView;
	private readonly littleEndian: boolean;
	private depth = 0;
	public cursor = 0;

	constructor(data: Uint8Array, endian: Endian = Endian.Big) {
		this.data = data;
		this.view = new DataView(data.buffer, data.byteOffset, data.byteLength);
		this.littleEndian = endian === Endian.Little;
	}

	get remaining(): number {
		return this.data.length - this.cursor;
	}

	/** Advance the cursor by `size` bytes and return the previous position. */
	private take(size: number): number {
		const start = this.cursor;
		if (size < 0) {
			throw new NbtError(`Negative length: ${size}`, NbtErrorKind.InvalidData);
		}
		if (size > this.data.length - start) {
			throw new NbtError("Unexpected end of data", NbtErrorKind.UnexpectedEof);
		}
		this.cursor = start + size;
		return start;
	}

	private readLength(): number {
		const length = this.readI32();
		if (length < 0) {
			throw new NbtError(`Negative length: ${length}`, NbtErrorKind.InvalidData);
		}
		return length;
	}

	/** Read and validate the length of a list whose element type was just read. */
	private readListLength(listType: NbtType): number {
		if (listType > NbtType.LongArray) {
			throw new NbtError(`Invalid tag type: ${listType}`, NbtErrorKind.InvalidTagType);
		}
		const length = this.readLength();
		if (listType === NbtType.End && length > 0) {
			throw new NbtError("Non-empty list of End tags", NbtErrorKind.InvalidData);
		}
		if (length * MIN_SIZE[listType] > this.remaining) {
			throw new NbtError("Unexpected end of data", NbtErrorKind.UnexpectedEof);
		}
		return length;
	}

	private enter(): void {
		if (++this.depth > MAX_DEPTH) {
			throw new NbtError(`Tag nested deeper than ${MAX_DEPTH}`, NbtErrorKind.InvalidData);
		}
	}

	readU8(): number {
		return this.data[this.take(1)];
	}

	readI8(): number {
		return (this.readU8() << 24) >> 24;
	}

	readI16(): number {
		return this.view.getInt16(this.take(2), this.littleEndian);
	}

	readU16(): number {
		return this.view.getUint16(this.take(2), this.littleEndian);
	}

	readI32(): number {
		return this.view.getInt32(this.take(4), this.littleEndian);
	}

	readI64(): bigint {
		return this.view.getBigInt64(this.take(8), this.littleEndian);
	}

	readF32(): number {
		return this.view.getFloat32(this.take(4), this.littleEndian);
	}

	readF64(): number {
		return this.view.getFloat64(this.take(8), this.littleEndian);
	}

	/** Zero-copy view of the next `length` bytes. */
	readBytes(length: number): Uint8Array {
		const start = this.take(length);
		return this.data.subarray(start, start + length);
	}

	readString(): string {
		const length = this.readU16();
		const start = this.take(length);
		return decodeString(this.data, start, start + length);
	}

	readTag(tagType: NbtType): NbtTag {
		switch (tagType) {
			case NbtType.End:
				return { type: NbtType.End };
			case NbtType.Byte:
				return { type: NbtType.Byte, value: this.readI8() };
			case NbtType.Short:
				return { type: NbtType.Short, value: this.readI16() };
			case NbtType.Int:
				return { type: NbtType.Int, value: this.readI32() };
			case NbtType.Long:
				return { type: NbtType.Long, value: this.readI64() };
			case NbtType.Float:
				return { type: NbtType.Float, value: this.readF32() };
			case NbtType.Double:
				return { type: NbtType.Double, value: this.readF64() };
			case NbtType.ByteArray:
				return { type: NbtType.ByteArray, value: new Int8Array(this.readArray(1)) };
			case NbtType.String:
				return { type: NbtType.String, value: this.readString() };
			case NbtType.List:
				return this.readList();
			case NbtType.Compound:
				return this.readEntries(undefined);
			case NbtType.IntArray:
				return { type: NbtType.IntArray, value: new Int32Array(this.readArray(4)) };
			case NbtType.LongArray:
				return { type: NbtType.LongArray, value: new BigInt64Array(this.readArray(8)) };
			default:
				throw new NbtError(`Invalid tag type: ${tagType}`, NbtErrorKind.InvalidTagType);
		}
	}

	/** Copy a length-prefixed array into a fresh host-ordered buffer, so the tag never aliases the input. */
	private readArray(width: 1 | 4 | 8): ArrayBuffer {
		const byteLength = this.readLength() * width;
		const start = this.take(byteLength);
		const bytes = this.data.slice(start, start + byteLength);
		if (width !== 1) {
			toHostOrder(bytes, 0, byteLength, width, this.littleEndian);
		}
		return bytes.buffer;
	}

	private readList(): NbtList {
		const listType = this.readU8() as NbtType;
		const length = this.readListLength(listType);
		this.enter();
		const items = new Array<NbtTag>(length);
		for (let i = 0; i < length; i++) {
			items[i] = this.readTag(listType);
		}
		this.depth--;
		return { type: NbtType.List, listType, items };
	}

	private readEntries(wantedFields: ReadonlySet<string> | undefined): NbtCompound {
		this.enter();
		const entries = new Map<string, NbtTag>();
		for (;;) {
			const tagType = this.readU8() as NbtType;
			if (tagType === NbtType.End) {
				break;
			}
			const name = this.readString();
			if (wantedFields && !wantedFields.has(name)) {
				this.skipTag(tagType);
				continue;
			}
			entries.set(name, this.readTag(tagType));
		}
		this.depth--;
		return { type: NbtType.Compound, entries };
	}

	readCompound(): NbtCompound {
		return this.readEntries(undefined);
	}

	/**
	 * Read compound but only parse specified fields, skip others.
	 * This is the core lazy loading mechanism for performance.
	 */
	readCompoundSelective(wantedFields: ReadonlySet<string>): NbtCompound {
		return this.readEntries(wantedFields);
	}

	/**
	 * Advance cursor past a tag without parsing it.
	 * Enables lazy loading by skipping unwanted data.
	 */
	skipTag(tagType: NbtType): void {
		switch (tagType) {
			case NbtType.End:
			case NbtType.Byte:
			case NbtType.Short:
			case NbtType.Int:
			case NbtType.Long:
			case NbtType.Float:
			case NbtType.Double:
				this.take(MIN_SIZE[tagType]);
				return;
			case NbtType.ByteArray:
				this.take(this.readLength());
				return;
			case NbtType.String:
				this.take(this.readU16());
				return;
			case NbtType.IntArray:
				this.take(this.readLength() * 4);
				return;
			case NbtType.LongArray:
				this.take(this.readLength() * 8);
				return;
			case NbtType.List: {
				const listType = this.readU8() as NbtType;
				const length = this.readListLength(listType);
				if (listType <= NbtType.Double) {
					this.take(length * MIN_SIZE[listType]);
					return;
				}
				this.enter();
				for (let i = 0; i < length; i++) {
					this.skipTag(listType);
				}
				this.depth--;
				return;
			}
			case NbtType.Compound:
				this.enter();
				for (;;) {
					const innerType = this.readU8() as NbtType;
					if (innerType === NbtType.End) {
						break;
					}
					this.take(this.readU16());
					this.skipTag(innerType);
				}
				this.depth--;
				return;
			default:
				throw new NbtError(`Invalid tag type: ${tagType}`, NbtErrorKind.InvalidTagType);
		}
	}
}

/** Read the root tag header (type + name) shared by NbtFile and LazyNbtFile. */
export function readRootName(reader: NbtReader): string {
	const tagType = reader.readU8();
	if (tagType !== NbtType.Compound) {
		throw new NbtError(`Root tag must be compound, got ${tagType}`, NbtErrorKind.InvalidData);
	}

	return reader.readString();
}
