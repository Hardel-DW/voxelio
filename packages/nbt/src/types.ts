/**
 * NBT tag type identifiers matching the NBT specification.
 * Using const object for zero runtime overhead.
 */
export const NbtType = {
	End: 0,
	Byte: 1,
	Short: 2,
	Int: 3,
	Long: 4,
	Float: 5,
	Double: 6,
	ByteArray: 7,
	String: 8,
	List: 9,
	Compound: 10,
	IntArray: 11,
	LongArray: 12
} as const;

export type NbtType = (typeof NbtType)[keyof typeof NbtType];
export type NbtTag =
	| NbtEnd
	| NbtByte
	| NbtShort
	| NbtInt
	| NbtLong
	| NbtFloat
	| NbtDouble
	| NbtByteArray
	| NbtString
	| NbtList
	| NbtCompound
	| NbtIntArray
	| NbtLongArray;

/** End tag - marks compound termination */
export interface NbtEnd {
	readonly type: typeof NbtType.End;
}

/** 8-bit signed integer (-128 to 127) */
export interface NbtByte {
	readonly type: typeof NbtType.Byte;
	value: number;
}

/** 16-bit signed integer */
export interface NbtShort {
	readonly type: typeof NbtType.Short;
	value: number;
}

/** 32-bit signed integer */
export interface NbtInt {
	readonly type: typeof NbtType.Int;
	value: number;
}

/** 64-bit signed integer - uses bigint for precision */
export interface NbtLong {
	readonly type: typeof NbtType.Long;
	value: bigint;
}

/** 32-bit IEEE 754 floating point */
export interface NbtFloat {
	readonly type: typeof NbtType.Float;
	value: number;
}

/** 64-bit IEEE 754 floating point */
export interface NbtDouble {
	readonly type: typeof NbtType.Double;
	value: number;
}

/** Array of signed bytes */
export interface NbtByteArray {
	readonly type: typeof NbtType.ByteArray;
	value: Int8Array;
}

/** UTF-8 string */
export interface NbtString {
	readonly type: typeof NbtType.String;
	value: string;
}

/** Homogeneous list of tags */
export interface NbtList {
	readonly type: typeof NbtType.List;
	listType: NbtType;
	items: NbtTag[];
}

/** Key-value map of named tags */
export interface NbtCompound {
	readonly type: typeof NbtType.Compound;
	entries: Map<string, NbtTag>;
}

/** Array of 32-bit signed integers */
export interface NbtIntArray {
	readonly type: typeof NbtType.IntArray;
	value: Int32Array;
}

/** Array of 64-bit signed integers */
export interface NbtLongArray {
	readonly type: typeof NbtType.LongArray;
	value: BigInt64Array;
}

/** Endianness configuration */
export const Endian = { Big: 0, Little: 1 } as const;
export type Endian = (typeof Endian)[keyof typeof Endian];

/** Compression format */
export const Compression = { None: 0, Gzip: 1, Zlib: 2 } as const;
export type Compression = (typeof Compression)[keyof typeof Compression];
