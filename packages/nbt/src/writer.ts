import { encodeString, toHostOrder } from "@/encoding";
import { NbtError, NbtErrorKind } from "@/error";
import type { NbtTag } from "@/types";
import { Endian, NbtType } from "@/types";

const MAX_STRING_BYTES = 0xffff;

/**
 * High-performance NBT writer with dynamic buffer growth.
 * Big endian (Java) writes strings as modified UTF-8, little endian (Bedrock) as standard UTF-8.
 */
export class NbtWriter {
	private buffer: ArrayBuffer;
	private view: DataView;
	private array: Uint8Array;
	private readonly littleEndian: boolean;
	public offset = 0;

	constructor(endian: Endian = Endian.Big, initialSize = 1024) {
		this.buffer = new ArrayBuffer(initialSize);
		this.view = new DataView(this.buffer);
		this.array = new Uint8Array(this.buffer);
		this.littleEndian = endian === Endian.Little;
	}

	/** Get final byte array trimmed to actual size */
	getData(): Uint8Array {
		return this.array.subarray(0, this.offset);
	}

	/** Ensure buffer has capacity for additional bytes */
	private accommodate(size: number): void {
		const required = this.offset + size;
		if (this.buffer.byteLength >= required) {
			return;
		}

		const newBuffer = new ArrayBuffer(Math.max(this.buffer.byteLength * 2, required));
		const newArray = new Uint8Array(newBuffer);
		newArray.set(this.array.subarray(0, this.offset));
		this.buffer = newBuffer;
		this.view = new DataView(newBuffer);
		this.array = newArray;
	}

	writeU8(value: number): void {
		this.accommodate(1);
		this.array[this.offset++] = value;
	}

	writeI8(value: number): void {
		this.writeU8(value);
	}

	writeI16(value: number): void {
		this.accommodate(2);
		this.view.setInt16(this.offset, value, this.littleEndian);
		this.offset += 2;
	}

	writeU16(value: number): void {
		this.accommodate(2);
		this.view.setUint16(this.offset, value, this.littleEndian);
		this.offset += 2;
	}

	writeI32(value: number): void {
		this.accommodate(4);
		this.view.setInt32(this.offset, value, this.littleEndian);
		this.offset += 4;
	}

	writeI64(value: bigint): void {
		this.accommodate(8);
		this.view.setBigInt64(this.offset, value, this.littleEndian);
		this.offset += 8;
	}

	writeF32(value: number): void {
		this.accommodate(4);
		this.view.setFloat32(this.offset, value, this.littleEndian);
		this.offset += 4;
	}

	writeF64(value: number): void {
		this.accommodate(8);
		this.view.setFloat64(this.offset, value, this.littleEndian);
		this.offset += 8;
	}

	writeBytes(bytes: Uint8Array | ArrayLike<number>): void {
		const len = bytes.length;
		this.accommodate(len);
		this.array.set(bytes, this.offset);
		this.offset += len;
	}

	writeString(value: string): void {
		this.accommodate(2 + value.length * 3);
		const start = this.offset + 2;
		const end = encodeString(this.array, start, value, !this.littleEndian);
		const byteLength = end - start;
		if (byteLength > MAX_STRING_BYTES) {
			throw new NbtError(`String too long: ${byteLength} bytes (max ${MAX_STRING_BYTES})`, NbtErrorKind.InvalidData);
		}
		this.view.setUint16(this.offset, byteLength, this.littleEndian);
		this.offset = end;
	}

	/** Write a length-prefixed typed array, converting elements to the file byte order. */
	private writeArray(value: Int8Array | Int32Array | BigInt64Array, width: 1 | 4 | 8): void {
		const byteLength = value.length * width;
		this.writeI32(value.length);
		this.accommodate(byteLength);
		this.array.set(new Uint8Array(value.buffer, value.byteOffset, byteLength), this.offset);
		if (width !== 1) {
			toHostOrder(this.array, this.offset, this.offset + byteLength, width, this.littleEndian);
		}
		this.offset += byteLength;
	}

	writeTag(tag: NbtTag): void {
		switch (tag.type) {
			case NbtType.End:
				return;
			case NbtType.Byte:
				this.writeU8(tag.value);
				return;
			case NbtType.Short:
				this.writeI16(tag.value);
				return;
			case NbtType.Int:
				this.writeI32(tag.value);
				return;
			case NbtType.Long:
				this.writeI64(tag.value);
				return;
			case NbtType.Float:
				this.writeF32(tag.value);
				return;
			case NbtType.Double:
				this.writeF64(tag.value);
				return;
			case NbtType.ByteArray:
				this.writeArray(tag.value, 1);
				return;
			case NbtType.String:
				this.writeString(tag.value);
				return;
			case NbtType.List: {
				const items = tag.items;
				const listType = tag.listType === NbtType.End && items.length > 0 ? items[0].type : tag.listType;
				if (listType === NbtType.End && items.length > 0) {
					throw new NbtError("List cannot contain End tags", NbtErrorKind.InvalidData);
				}

				this.writeU8(listType);
				this.writeI32(items.length);
				for (const item of items) {
					if (item.type !== listType) {
						throw new NbtError(`List of type ${listType} contains a tag of type ${item.type}`, NbtErrorKind.InvalidData);
					}
					this.writeTag(item);
				}

				return;
			}
			case NbtType.Compound:
				for (const [name, value] of tag.entries) {
					if (value.type === NbtType.End) {
						throw new NbtError(`Compound entry "${name}" cannot be an End tag`, NbtErrorKind.InvalidData);
					}

					this.writeU8(value.type);
					this.writeString(name);
					this.writeTag(value);
				}
				this.writeU8(NbtType.End);
				return;
			case NbtType.IntArray:
				this.writeArray(tag.value, 4);
				return;
			case NbtType.LongArray:
				this.writeArray(tag.value, 8);
				return;
		}
	}
}
