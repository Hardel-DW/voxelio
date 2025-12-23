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

export function isEnd(tag: NbtTag): tag is NbtEnd {
	return tag.type === NbtType.End;
}

export function isByte(tag: NbtTag): tag is NbtByte {
	return tag.type === NbtType.Byte;
}

export function isShort(tag: NbtTag): tag is NbtShort {
	return tag.type === NbtType.Short;
}

export function isInt(tag: NbtTag): tag is NbtInt {
	return tag.type === NbtType.Int;
}

export function isLong(tag: NbtTag): tag is NbtLong {
	return tag.type === NbtType.Long;
}

export function isFloat(tag: NbtTag): tag is NbtFloat {
	return tag.type === NbtType.Float;
}

export function isDouble(tag: NbtTag): tag is NbtDouble {
	return tag.type === NbtType.Double;
}

export function isByteArray(tag: NbtTag): tag is NbtByteArray {
	return tag.type === NbtType.ByteArray;
}

export function isString(tag: NbtTag): tag is NbtString {
	return tag.type === NbtType.String;
}

export function isList(tag: NbtTag): tag is NbtList {
	return tag.type === NbtType.List;
}

export function isCompound(tag: NbtTag): tag is NbtCompound {
	return tag.type === NbtType.Compound;
}

export function isIntArray(tag: NbtTag): tag is NbtIntArray {
	return tag.type === NbtType.IntArray;
}

export function isLongArray(tag: NbtTag): tag is NbtLongArray {
	return tag.type === NbtType.LongArray;
}

export function isNumeric(tag: NbtTag): tag is NbtByte | NbtShort | NbtInt | NbtLong | NbtFloat | NbtDouble {
	return tag.type >= NbtType.Byte && tag.type <= NbtType.Double;
}

export function isArray(tag: NbtTag): tag is NbtByteArray | NbtIntArray | NbtLongArray {
	return tag.type === NbtType.ByteArray || tag.type === NbtType.IntArray || tag.type === NbtType.LongArray;
}
