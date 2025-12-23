import type {
	NbtByte,
	NbtByteArray,
	NbtCompound,
	NbtDouble,
	NbtEnd,
	NbtFloat,
	NbtInt,
	NbtIntArray,
	NbtList,
	NbtLong,
	NbtLongArray,
	NbtShort,
	NbtString,
	NbtTag
} from "@/types";
import { NbtType } from "@/types";

export const nbt = {
	end(): NbtEnd {
		return { type: NbtType.End };
	},

	byte(value: number): NbtByte {
		return { type: NbtType.Byte, value: value | 0 };
	},

	short(value: number): NbtShort {
		return { type: NbtType.Short, value: value | 0 };
	},

	int(value: number): NbtInt {
		return { type: NbtType.Int, value: value | 0 };
	},

	long(value: bigint | number): NbtLong {
		return { type: NbtType.Long, value: typeof value === "bigint" ? value : BigInt(value) };
	},

	float(value: number): NbtFloat {
		return { type: NbtType.Float, value };
	},

	double(value: number): NbtDouble {
		return { type: NbtType.Double, value };
	},

	byteArray(value: Int8Array | ArrayLike<number>): NbtByteArray {
		return {
			type: NbtType.ByteArray,
			value: value instanceof Int8Array ? value : new Int8Array(value)
		};
	},

	string(value: string): NbtString {
		return { type: NbtType.String, value };
	},

	list(items: NbtTag[] = [], listType?: NbtType): NbtList {
		return {
			type: NbtType.List,
			listType: listType ?? (items.length > 0 ? items[0].type : NbtType.End),
			items
		};
	},

	compound(entries?: Map<string, NbtTag> | Record<string, NbtTag>): NbtCompound {
		if (!entries) {
			return { type: NbtType.Compound, entries: new Map() };
		}
		if (entries instanceof Map) {
			return { type: NbtType.Compound, entries };
		}
		return { type: NbtType.Compound, entries: new Map(Object.entries(entries)) };
	},

	intArray(value: Int32Array | ArrayLike<number>): NbtIntArray {
		return {
			type: NbtType.IntArray,
			value: value instanceof Int32Array ? value : new Int32Array(value)
		};
	},

	longArray(value: BigInt64Array | ArrayLike<bigint>): NbtLongArray {
		return {
			type: NbtType.LongArray,
			value: value instanceof BigInt64Array ? value : new BigInt64Array(value)
		};
	}
} as const;
