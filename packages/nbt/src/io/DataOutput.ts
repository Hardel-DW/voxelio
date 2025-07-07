export interface DataOutput {
	writeByte(value: number): void;
	writeShort(value: number): void;
	writeInt(value: number): void;
	writeFloat(value: number): void;
	writeDouble(value: number): void;
	writeBytes(bytes: ArrayLike<number>): void;
	writeString(value: string): void;
	getData(): Uint8Array;
}

export interface RawDataOutputOptions {
	littleEndian?: boolean;
	offset?: number;
	initialSize?: number;
}

export class RawDataOutput implements DataOutput {
	private readonly littleEndian: boolean;
	public offset: number;
	private buffer: ArrayBuffer;
	private array: Uint8Array;
	private view: DataView;

	constructor(options?: RawDataOutputOptions) {
		this.littleEndian = options?.littleEndian ?? false;
		this.offset = options?.offset ?? 0;
		this.buffer = new ArrayBuffer(options?.initialSize ?? 1024);
		this.array = new Uint8Array(this.buffer);
		this.view = new DataView(this.buffer);
	}

	private accommodate(size: number) {
		const requiredLength = this.offset + size;
		if (this.buffer.byteLength >= requiredLength) {
			return;
		}

		let newLength = this.buffer.byteLength;
		while (newLength < requiredLength) {
			newLength = Math.max(Math.ceil(newLength * 1.5), requiredLength);
		}

		const newBuffer = new ArrayBuffer(newLength);
		const newArray = new Uint8Array(newBuffer);
		newArray.set(this.array);

		if (this.offset > this.buffer.byteLength) {
			newArray.fill(0, this.buffer.byteLength, this.offset);
		}

		this.buffer = newBuffer;
		this.view = new DataView(newBuffer);
		this.array = newArray;
	}

	private writeNumber(type: "setInt8" | "setInt16" | "setInt32" | "setFloat32" | "setFloat64", size: number, value: number) {
		this.accommodate(size);
		this.view[type](this.offset, value, this.littleEndian);
		this.offset += size;
	}

	public writeByte(value: number): void {
		this.writeNumber("setInt8", 1, value);
	}

	public writeShort(value: number): void {
		this.writeNumber("setInt16", 2, value);
	}

	public writeInt(value: number): void {
		this.writeNumber("setInt32", 4, value);
	}

	public writeFloat(value: number): void {
		this.writeNumber("setFloat32", 4, value);
	}

	public writeDouble(value: number): void {
		this.writeNumber("setFloat64", 8, value);
	}

	public writeBytes(bytes: ArrayLike<number>) {
		this.accommodate(bytes.length);
		this.array.set(bytes, this.offset);
		this.offset += bytes.length;
	}

	public writeString(value: string) {
		const bytes = Array.from(new TextEncoder().encode(value));
		this.writeShort(bytes.length);
		this.writeBytes(bytes);
	}

	public getData() {
		this.accommodate(0);
		return this.array.slice(0, this.offset);
	}
}
