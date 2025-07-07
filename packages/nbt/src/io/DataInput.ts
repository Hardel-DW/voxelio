export interface DataInput {
	readByte(): number;
	readInt(): number;
	readShort(): number;
	readFloat(): number;
	readDouble(): number;
	readBytes(length: number): ArrayLike<number>;
	readString(): string;
}

export interface RawDataInputOptions {
	littleEndian?: boolean;
	offset?: number;
}

export class RawDataInput implements DataInput {
	private readonly littleEndian: boolean;
	public offset: number;
	private readonly array: Uint8Array;
	private readonly view: DataView;

	constructor(input: Uint8Array | ArrayLike<number> | ArrayBuffer, options?: RawDataInputOptions) {
		this.littleEndian = options?.littleEndian ?? false;
		this.offset = options?.offset ?? 0;
		this.array = input instanceof Uint8Array ? input : new Uint8Array(input);
		this.view = new DataView(this.array.buffer, this.array.byteOffset);
	}

	private readNumber(type: "getInt8" | "getInt16" | "getInt32" | "getFloat32" | "getFloat64", size: number) {
		const value = this.view[type](this.offset, this.littleEndian);
		this.offset += size;
		return value;
	}

	public readByte(): number {
		return this.readNumber("getInt8", 1);
	}

	public readShort(): number {
		return this.readNumber("getInt16", 2);
	}

	public readInt(): number {
		return this.readNumber("getInt32", 4);
	}

	public readFloat(): number {
		return this.readNumber("getFloat32", 4);
	}

	public readDouble(): number {
		return this.readNumber("getFloat64", 8);
	}

	public readBytes(length: number): ArrayLike<number> {
		const bytes = this.array.slice(this.offset, this.offset + length);
		this.offset += length;
		return bytes;
	}

	public readString(): string {
		const length = this.readShort();
		const bytes = this.readBytes(length);
		const uint8Array = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
		return new TextDecoder().decode(uint8Array);
	}
}
