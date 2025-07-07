import { NbtByte } from "@/tags/NbtByte";
import { NbtByteArray } from "@/tags/NbtByteArray";
import { NbtCompound } from "@/tags/NbtCompound";
import { NbtDouble } from "@/tags/NbtDouble";
import { NbtFloat } from "@/tags/NbtFloat";
import { NbtInt } from "@/tags/NbtInt";
import { NbtIntArray } from "@/tags/NbtIntArray";
import { NbtList } from "@/tags/NbtList";
import { NbtLong } from "@/tags/NbtLong";
import { NbtLongArray } from "@/tags/NbtLongArray";
import { NbtShort } from "@/tags/NbtShort";
import { NbtString } from "@/tags/NbtString";
import type { NbtTag } from "@/tags/NbtTag";
import { NbtType } from "@/tags/NbtType";
import { StringReader } from "@/util/StringReader";

/**
 * SNBT Parser
 */
export namespace NbtParser {
	const DOUBLE_PATTERN_NOSUFFIX = /^[-+]?(?:[0-9]+[.]|[0-9]*[.][0-9]+)(?:e[-+]?[0-9]+)?$/i;
	const DOUBLE_PATTERN = /^[-+]?(?:[0-9]+[.]?|[0-9]*[.][0-9]+)(?:e[-+]?[0-9]+)?d$/i;
	const FLOAT_PATTERN = /^[-+]?(?:[0-9]+[.]?|[0-9]*[.][0-9]+)(?:e[-+]?[0-9]+)?f$/i;
	const BYTE_PATTERN = /^[-+]?(?:0|[1-9][0-9]*)b$/i;
	const LONG_PATTERN = /^[-+]?(?:0|[1-9][0-9]*)l$/i;
	const SHORT_PATTERN = /^[-+]?(?:0|[1-9][0-9]*)s$/i;
	const INT_PATTERN = /^[-+]?(?:0|[1-9][0-9]*)$/i;

	export function readTag(reader: StringReader): NbtTag {
		reader.skipWhitespace();
		if (!reader.canRead()) {
			throw reader.createError("Expected value");
		}
		const c = reader.peek();
		if (c === "{") {
			return readCompound(reader);
		} else if (c === "[") {
			if (reader.canRead(3) && !StringReader.isQuotedStringStart(reader.peek(1)) && reader.peek(2) === ";") {
				reader.expect("[", true);
				const start = reader.cursor;
				const d = reader.read();
				reader.skip();
				reader.skipWhitespace();
				if (!reader.canRead()) {
					throw reader.createError("Expected value");
				} else if (d === "B") {
					return readArray(reader, NbtByteArray, NbtType.ByteArray, NbtType.Byte);
				} else if (d === "L") {
					return readArray(reader, NbtLongArray, NbtType.LongArray, NbtType.Long);
				} else if (d === "I") {
					return readArray(reader, NbtIntArray, NbtType.IntArray, NbtType.Int);
				} else {
					reader.cursor = start;
					throw reader.createError(`Invalid array type '${d}'`);
				}
			} else {
				return readList(reader);
			}
		} else {
			reader.skipWhitespace();
			const start = reader.cursor;
			if (StringReader.isQuotedStringStart(reader.peek())) {
				return new NbtString(reader.readQuotedString());
			} else {
				const value = reader.readUnquotedString();
				if (value.length === 0) {
					reader.cursor = start;
					throw reader.createError("Expected value");
				}
				try {
					if (FLOAT_PATTERN.test(value)) {
						const number = Number(value.substring(0, value.length - 1));
						return new NbtFloat(number);
					} else if (BYTE_PATTERN.test(value)) {
						const number = Number(value.substring(0, value.length - 1));
						return new NbtByte(Math.floor(number));
					} else if (LONG_PATTERN.test(value)) {
						const number = BigInt(value.substring(0, value.length - 1));
						return new NbtLong(number);
					} else if (SHORT_PATTERN.test(value)) {
						const number = Number(value.substring(0, value.length - 1));
						return new NbtShort(Math.floor(number));
					} else if (INT_PATTERN.test(value)) {
						const number = Number(value);
						return new NbtInt(Math.floor(number));
					} else if (DOUBLE_PATTERN.test(value)) {
						const number = Number(value.substring(0, value.length - 1));
						return new NbtDouble(number);
					} else if (DOUBLE_PATTERN_NOSUFFIX.test(value)) {
						const number = Number(value);
						return new NbtDouble(number);
					} else if (value.toLowerCase() === "true") {
						return NbtByte.ONE;
					} else if (value.toLowerCase() === "false") {
						return NbtByte.ZERO;
					}
				} catch (error) {
					// Log parsing errors for debugging but continue with fallback
					console.warn(`Failed to parse numeric value "${value}":`, error);
				}
				return value.length === 0 ? NbtString.EMPTY : new NbtString(value);
			}
		}
	}

	function readCompound(reader: StringReader) {
		reader.expect("{", true);
		const properties = new Map<string, NbtTag>();
		reader.skipWhitespace();
		while (reader.canRead() && reader.peek() !== "}") {
			const start = reader.cursor;
			reader.skipWhitespace();
			if (!reader.canRead()) {
				throw reader.createError("Expected key");
			}
			const key = reader.readString();
			if (key.length === 0) {
				reader.cursor = start;
				throw reader.createError("Expected key");
			}
			reader.expect(":", true);
			const value = readTag(reader);
			properties.set(key, value);
			if (!hasElementSeparator(reader)) {
				break;
			}
			if (!reader.canRead()) {
				throw reader.createError("Expected key");
			}
		}
		reader.expect("}", true);
		return new NbtCompound(properties);
	}

	function readList(reader: StringReader) {
		reader.expect("[", true);
		reader.skipWhitespace();
		if (!reader.canRead()) {
			throw reader.createError("Expected value");
		}
		const items: NbtTag[] = [];
		let type = NbtType.End;
		while (reader.peek() !== "]") {
			const start = reader.cursor;
			const value = readTag(reader);
			const valueId = value.getId();
			if (type === NbtType.End) {
				type = valueId;
			} else if (valueId !== type) {
				reader.cursor = start;
				throw reader.createError(`Can't insert ${NbtType[valueId]} into list of ${NbtType[type]}`);
			}
			items.push(value);
			if (!hasElementSeparator(reader)) {
				break;
			}
			if (!reader.canRead()) {
				throw reader.createError("Expected value");
			}
		}
		reader.expect("]", true);
		return new NbtList(items, type);
	}

	function readArray<D>(reader: StringReader, factory: { new(data: D[]): NbtTag }, arrayId: NbtType, childId: NbtType) {
		const values: D[] = [];
		while (reader.peek() !== "]") {
			const entry = readTag(reader);
			if (entry.getId() !== childId) {
				throw reader.createError(`Can't insert ${NbtType[entry.getId()]} into ${NbtType[arrayId]}`);
			}
			values.push((entry.isLong() ? entry.getAsPair() : entry.getAsNumber()) as unknown as D);
			if (!hasElementSeparator(reader)) {
				break;
			}
			if (!reader.canRead()) {
				throw reader.createError("Expected value");
			}
		}
		reader.expect("]");
		return new factory(values);
	}

	function hasElementSeparator(reader: StringReader) {
		reader.skipWhitespace();
		if (reader.canRead() && reader.peek() === ",") {
			reader.skip();
			reader.skipWhitespace();
			return true;
		} else {
			return false;
		}
	}
}
