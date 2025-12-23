import type { NbtTag } from "@/types";
import { Endian, NbtType } from "@/types";

const textEncoder = new TextEncoder();

/**
 * High-performance NBT writer with dynamic buffer growth.
 */
export class NbtWriter {
	private buffer: ArrayBuffer;
	private view: DataView;
	private array: Uint8Array;
	private readonly littleEndian: boolean;
	public offset: number;

	constructor(endian: Endian = Endian.Big, initialSize = 1024) {
		this.buffer = new ArrayBuffer(initialSize);
		this.view = new DataView(this.buffer);
		this.array = new Uint8Array(this.buffer);
		this.littleEndian = endian === Endian.Little;
		this.offset = 0;
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

		let newSize = this.buffer.byteLength;
		while (newSize < required) {
			newSize *= 2;
		}

		const newBuffer = new ArrayBuffer(newSize);
		const newArray = new Uint8Array(newBuffer);
		newArray.set(this.array);
		this.buffer = newBuffer;
		this.view = new DataView(newBuffer);
		this.array = newArray;
	}

	writeU8(value: number): void {
		this.accommodate(1);
		this.array[this.offset++] = value;
	}

	writeI8(value: number): void {
		this.accommodate(1);
		this.view.setInt8(this.offset++, value);
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
		const encoded = textEncoder.encode(value);
		this.writeU16(encoded.length);
		this.writeBytes(encoded);
	}

	writeTag(tag: NbtTag): void {
		switch (tag.type) {
			case NbtType.End:
				break;
			case NbtType.Byte:
				this.writeI8(tag.value);
				break;
			case NbtType.Short:
				this.writeI16(tag.value);
				break;
			case NbtType.Int:
				this.writeI32(tag.value);
				break;
			case NbtType.Long:
				this.writeI64(tag.value);
				break;
			case NbtType.Float:
				this.writeF32(tag.value);
				break;
			case NbtType.Double:
				this.writeF64(tag.value);
				break;
			case NbtType.ByteArray:
				this.writeI32(tag.value.length);
				for (const byte of tag.value) {
					this.writeI8(byte);
				}
				break;
			case NbtType.String:
				this.writeString(tag.value);
				break;
			case NbtType.List:
				this.writeU8(tag.listType);
				this.writeI32(tag.items.length);
				for (const item of tag.items) {
					this.writeTag(item);
				}
				break;
			case NbtType.Compound:
				for (const [name, value] of tag.entries) {
					this.writeU8(value.type);
					this.writeString(name);
					this.writeTag(value);
				}
				this.writeU8(NbtType.End);
				break;
			case NbtType.IntArray:
				this.writeI32(tag.value.length);
				for (const int of tag.value) {
					this.writeI32(int);
				}
				break;
			case NbtType.LongArray:
				this.writeI32(tag.value.length);
				for (const long of tag.value) {
					this.writeI64(long);
				}
				break;
		}
	}
}
