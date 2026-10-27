/**
 * Byte-level codecs shared by NbtReader and NbtWriter.
 *
 * Java Edition stores strings as Java "modified UTF-8" (DataOutput.writeUTF): U+0000 is written as C0 80 and
 * supplementary characters as two 3-byte surrogates. Bedrock Edition uses standard UTF-8. The decoder accepts both.
 */

const HOST_LITTLE_ENDIAN = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;
const textDecoder = new TextDecoder();
const CHUNK_SIZE = 8192;

/**
 * Short ASCII strings (tag names, block ids, property values) repeat massively inside a file.
 * They are interned in a direct-mapped cache keyed by their bytes, so a hit allocates nothing.
 */
const CACHE_BITS = 12;
const CACHE_SIZE = 1 << CACHE_BITS;
const CACHE_MAX_LENGTH = 32;
const cacheLengths = new Uint8Array(CACHE_SIZE);
const cacheBytes = new Uint8Array(CACHE_SIZE * CACHE_MAX_LENGTH);
const cacheValues = new Array<string>(CACHE_SIZE).fill("");

/** Decode bytes[start, end) as (modified) UTF-8. */
export function decodeString(bytes: Uint8Array, start: number, end: number): string {
	const length = end - start;
	if (length === 0) {
		return "";
	}

	if (length > CACHE_MAX_LENGTH) {
		return decodeLong(bytes, start, end);
	}

	let hash = length;
	for (let i = start; i < end; i++) {
		const byte = bytes[i];
		if (byte >= 0x80) {
			return decodeUtf8(bytes, start, end);
		}

		hash = Math.imul(hash ^ byte, 0x01000193);
	}

	const slot = (hash ^ (hash >>> CACHE_BITS)) & (CACHE_SIZE - 1);
	const base = slot * CACHE_MAX_LENGTH;
	if (cacheLengths[slot] === length) {
		let i = 0;
		while (i < length && cacheBytes[base + i] === bytes[start + i]) {
			i++;
		}

		if (i === length) {
			return cacheValues[slot];
		}
	}

	const value = textDecoder.decode(bytes.subarray(start, end));
	for (let i = 0; i < length; i++) {
		cacheBytes[base + i] = bytes[start + i];
	}

	cacheLengths[slot] = length;
	cacheValues[slot] = value;
	return value;
}

function decodeLong(bytes: Uint8Array, start: number, end: number): string {
	for (let i = start; i < end; i++) {
		if (bytes[i] >= 0x80) {
			return decodeUtf8(bytes, start, end);
		}
	}

	return textDecoder.decode(bytes.subarray(start, end));
}

/** Lenient decoder for 1 to 4 byte sequences, including CESU-style surrogates. Malformed bytes become U+FFFD. */
function decodeUtf8(bytes: Uint8Array, start: number, end: number): string {
	const units = new Uint16Array(end - start);
	let count = 0;
	let i = start;

	while (i < end) {
		const a = bytes[i];
		if (a < 0x80) {
			units[count++] = a;
			i++;
			continue;
		}

		if (a >= 0xc0 && a < 0xe0 && i + 1 < end && isContinuation(bytes[i + 1])) {
			units[count++] = ((a & 0x1f) << 6) | (bytes[i + 1] & 0x3f);
			i += 2;
			continue;
		}

		if (a >= 0xe0 && a < 0xf0 && i + 2 < end && isContinuation(bytes[i + 1]) && isContinuation(bytes[i + 2])) {
			units[count++] = ((a & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f);
			i += 3;
			continue;
		}

		if (
			a >= 0xf0 &&
			a < 0xf8 &&
			i + 3 < end &&
			isContinuation(bytes[i + 1]) &&
			isContinuation(bytes[i + 2]) &&
			isContinuation(bytes[i + 3])
		) {
			const codePoint =
				(((a & 0x07) << 18) | ((bytes[i + 1] & 0x3f) << 12) | ((bytes[i + 2] & 0x3f) << 6) | (bytes[i + 3] & 0x3f)) - 0x10000;
			units[count++] = 0xd800 | (codePoint >> 10);
			units[count++] = 0xdc00 | (codePoint & 0x3ff);
			i += 4;
			continue;
		}

		units[count++] = 0xfffd;
		i++;
	}

	let result = "";
	for (let offset = 0; offset < count; offset += CHUNK_SIZE) {
		result += String.fromCharCode(...units.subarray(offset, Math.min(offset + CHUNK_SIZE, count)));
	}

	return result;
}

function isContinuation(byte: number): boolean {
	return (byte & 0xc0) === 0x80;
}

/**
 * Encode `value` into target starting at `offset` and return the end offset.
 * Requires value.length * 3 bytes of capacity.
 * @param modified - Java modified UTF-8 when true, standard UTF-8 when false.
 */
export function encodeString(target: Uint8Array, offset: number, value: string, modified: boolean): number {
	let pos = offset;
	const length = value.length;
	for (let i = 0; i < length; i++) {
		let code = value.charCodeAt(i);
		if (code < 0x80 && (code !== 0 || !modified)) {
			target[pos++] = code;
			continue;
		}

		if (code < 0x800) {
			target[pos++] = 0xc0 | (code >> 6);
			target[pos++] = 0x80 | (code & 0x3f);
			continue;
		}

		if (!modified && code >= 0xd800 && code <= 0xdfff) {
			const next = i + 1 < length ? value.charCodeAt(i + 1) : 0;
			if (code > 0xdbff || next < 0xdc00 || next > 0xdfff) {
				code = 0xfffd;
			} else {
				const codePoint = ((code - 0xd800) << 10) + (next - 0xdc00) + 0x10000;
				target[pos++] = 0xf0 | (codePoint >> 18);
				target[pos++] = 0x80 | ((codePoint >> 12) & 0x3f);
				target[pos++] = 0x80 | ((codePoint >> 6) & 0x3f);
				target[pos++] = 0x80 | (codePoint & 0x3f);
				i++;
				continue;
			}
		}

		target[pos++] = 0xe0 | (code >> 12);
		target[pos++] = 0x80 | ((code >> 6) & 0x3f);
		target[pos++] = 0x80 | (code & 0x3f);
	}
	return pos;
}

/** Reverse the byte order of each `width`-byte element of bytes[start, end) when the file and host endianness differ. */
export function toHostOrder(bytes: Uint8Array, start: number, end: number, width: 4 | 8, littleEndian: boolean): void {
	if (littleEndian === HOST_LITTLE_ENDIAN) {
		return;
	}

	for (let i = start; i < end; i += width) {
		for (let lo = i, hi = i + width - 1; lo < hi; lo++, hi--) {
			const byte = bytes[lo];
			bytes[lo] = bytes[hi];
			bytes[hi] = byte;
		}
	}
}
