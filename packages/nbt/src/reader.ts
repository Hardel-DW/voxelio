import { NbtError, NbtErrorKind } from "@/error";
import { nbt } from "@/tags";
import type { NbtByteArray, NbtCompound, NbtIntArray, NbtList, NbtLongArray, NbtTag } from "@/types";
import { Endian, NbtType } from "@/types";

const textDecoder = new TextDecoder("utf-8");

/**
 * High-performance NBT reader with cursor-based parsing.
 * Supports selective field parsing and skip mechanism for lazy loading.
 */
export class NbtReader {
	private readonly data: Uint8Array;
	private readonly view: DataView;
	private readonly littleEndian: boolean;
	public cursor: number;

	constructor(data: Uint8Array, endian: Endian = Endian.Big) {
		this.data = data;
		this.view = new DataView(data.buffer, data.byteOffset, data.byteLength);
		this.littleEndian = endian === Endian.Little;
		this.cursor = 0;
	}

	get remaining(): number {
		return this.data.length - this.cursor;
	}

	readU8(): number {
		if (this.cursor >= this.data.length) {
			throw new NbtError("Unexpected end of data", NbtErrorKind.UnexpectedEof);
		}
		return this.data[this.cursor++];
	}

	readI8(): number {
		const value = this.readU8();
		return value > 127 ? value - 256 : value;
	}

	readI16(): number {
		if (this.remaining < 2) {
			throw new NbtError("Unexpected end of data", NbtErrorKind.UnexpectedEof);
		}
		const value = this.view.getInt16(this.cursor, this.littleEndian);
		this.cursor += 2;
		return value;
	}

	readU16(): number {
		if (this.remaining < 2) {
			throw new NbtError("Unexpected end of data", NbtErrorKind.UnexpectedEof);
		}
		const value = this.view.getUint16(this.cursor, this.littleEndian);
		this.cursor += 2;
		return value;
	}

	readI32(): number {
		if (this.remaining < 4) {
			throw new NbtError("Unexpected end of data", NbtErrorKind.UnexpectedEof);
		}
		const value = this.view.getInt32(this.cursor, this.littleEndian);
		this.cursor += 4;
		return value;
	}

	readI64(): bigint {
		if (this.remaining < 8) {
			throw new NbtError("Unexpected end of data", NbtErrorKind.UnexpectedEof);
		}
		const value = this.view.getBigInt64(this.cursor, this.littleEndian);
		this.cursor += 8;
		return value;
	}

	readF32(): number {
		if (this.remaining < 4) {
			throw new NbtError("Unexpected end of data", NbtErrorKind.UnexpectedEof);
		}
		const value = this.view.getFloat32(this.cursor, this.littleEndian);
		this.cursor += 4;
		return value;
	}

	readF64(): number {
		if (this.remaining < 8) {
			throw new NbtError("Unexpected end of data", NbtErrorKind.UnexpectedEof);
		}
		const value = this.view.getFloat64(this.cursor, this.littleEndian);
		this.cursor += 8;
		return value;
	}

	readBytes(length: number): Uint8Array {
		if (this.remaining < length) {
			throw new NbtError("Unexpected end of data", NbtErrorKind.UnexpectedEof);
		}
		const slice = this.data.subarray(this.cursor, this.cursor + length);
		this.cursor += length;
		return slice;
	}

	readString(): string {
		const length = this.readU16();
		const bytes = this.readBytes(length);
		return textDecoder.decode(bytes);
	}

	readTag(tagType: NbtType): NbtTag {
		switch (tagType) {
			case NbtType.End:
				return nbt.end();
			case NbtType.Byte:
				return nbt.byte(this.readI8());
			case NbtType.Short:
				return nbt.short(this.readI16());
			case NbtType.Int:
				return nbt.int(this.readI32());
			case NbtType.Long:
				return nbt.long(this.readI64());
			case NbtType.Float:
				return nbt.float(this.readF32());
			case NbtType.Double:
				return nbt.double(this.readF64());
			case NbtType.ByteArray:
				return this.readByteArray();
			case NbtType.String:
				return nbt.string(this.readString());
			case NbtType.List:
				return this.readList();
			case NbtType.Compound:
				return this.readCompound();
			case NbtType.IntArray:
				return this.readIntArray();
			case NbtType.LongArray:
				return this.readLongArray();
			default:
				throw new NbtError(`Invalid tag type: ${tagType}`, NbtErrorKind.InvalidTagType);
		}
	}

	private readByteArray(): NbtByteArray {
		const length = this.readI32();
		if (this.remaining < length) {
			throw new NbtError("Unexpected end of data", NbtErrorKind.UnexpectedEof);
		}
		const array = new Int8Array(this.data.buffer, this.data.byteOffset + this.cursor, length);
		this.cursor += length;
		return { type: NbtType.ByteArray, value: array };
	}

	private readIntArray(): NbtIntArray {
		const length = this.readI32();
		const byteLen = length * 4;
		if (this.remaining < byteLen) {
			throw new NbtError("Unexpected end of data", NbtErrorKind.UnexpectedEof);
		}
		const array = new Int32Array(length);
		for (let i = 0; i < length; i++) {
			array[i] = this.view.getInt32(this.cursor + i * 4, this.littleEndian);
		}
		this.cursor += byteLen;
		return { type: NbtType.IntArray, value: array };
	}

	private readLongArray(): NbtLongArray {
		const length = this.readI32();
		const byteLen = length * 8;
		if (this.remaining < byteLen) {
			throw new NbtError("Unexpected end of data", NbtErrorKind.UnexpectedEof);
		}
		const array = new BigInt64Array(length);
		// Batch read with DataView - avoids per-element function call overhead
		for (let i = 0; i < length; i++) {
			array[i] = this.view.getBigInt64(this.cursor + i * 8, this.littleEndian);
		}
		this.cursor += byteLen;
		return { type: NbtType.LongArray, value: array };
	}

	private readList(): NbtList {
		const listType = this.readU8() as NbtType;
		const length = this.readI32();
		const items = new Array<NbtTag>(length);
		for (let i = 0; i < length; i++) {
			items[i] = this.readTag(listType);
		}
		return { type: NbtType.List, listType, items };
	}

	readCompound(): NbtCompound {
		const entries = new Map<string, NbtTag>();

		for (;;) {
			const tagType = this.readU8() as NbtType;
			if (tagType === NbtType.End) {
				break;
			}
			const name = this.readString();
			const value = this.readTag(tagType);
			entries.set(name, value);
		}

		return { type: NbtType.Compound, entries };
	}

	/**
	 * Read compound but only parse specified fields, skip others.
	 * This is the core lazy loading mechanism for performance.
	 */
	readCompoundSelective(wantedFields: ReadonlySet<string>): NbtCompound {
		const entries = new Map<string, NbtTag>();

		for (;;) {
			const tagType = this.readU8() as NbtType;
			if (tagType === NbtType.End) {
				break;
			}
			const name = this.readString();

			if (wantedFields.has(name)) {
				const value = this.readTag(tagType);
				entries.set(name, value);
			} else {
				this.skipTag(tagType);
			}
		}

		return { type: NbtType.Compound, entries };
	}

	/**
	 * Advance cursor past a tag without parsing it.
	 * Enables lazy loading by skipping unwanted data.
	 */
	skipTag(tagType: NbtType): void {
		switch (tagType) {
			case NbtType.End:
				break;
			case NbtType.Byte:
				this.cursor += 1;
				break;
			case NbtType.Short:
				this.cursor += 2;
				break;
			case NbtType.Int:
			case NbtType.Float:
				this.cursor += 4;
				break;
			case NbtType.Long:
			case NbtType.Double:
				this.cursor += 8;
				break;
			case NbtType.ByteArray: {
				const length = this.readI32();
				this.cursor += length;
				break;
			}
			case NbtType.String: {
				const length = this.readU16();
				this.cursor += length;
				break;
			}
			case NbtType.List: {
				const listType = this.readU8() as NbtType;
				const length = this.readI32();
				for (let i = 0; i < length; i++) {
					this.skipTag(listType);
				}
				break;
			}
			case NbtType.Compound: {
				for (;;) {
					const innerTagType = this.readU8() as NbtType;
					if (innerTagType === NbtType.End) {
						break;
					}
					const nameLen = this.readU16();
					this.cursor += nameLen;
					this.skipTag(innerTagType);
				}
				break;
			}
			case NbtType.IntArray: {
				const length = this.readI32();
				this.cursor += length * 4;
				break;
			}
			case NbtType.LongArray: {
				const length = this.readI32();
				this.cursor += length * 8;
				break;
			}
			default:
				throw new NbtError(`Invalid tag type: ${tagType}`, NbtErrorKind.InvalidTagType);
		}
	}
}
