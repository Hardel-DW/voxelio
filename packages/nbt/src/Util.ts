export function hasGzipHeader(array: Uint8Array) {
	var head = array.slice(0, 2);
	return head.length === 2 && head[0] === 0x1f && head[1] === 0x8b;
}

export function hasZlibHeader(array: Uint8Array) {
	const head = array.slice(0, 2);
	return head.length === 2 && head[0] === 0x78 && (head[1] === 0x01 || head[1] === 0x5e || head[1] === 0x9c || head[2] === 0xda);
}

export function getBedrockHeader(array: Uint8Array) {
	const head = array.slice(0, 8);
	const view = new DataView(head.buffer, head.byteOffset);
	const version = view.getUint32(0, true);
	const length = view.getUint32(4, true);
	if (head.length === 8 && version > 0 && version < 100 && length === array.byteLength - 8) {
		return version;
	}
	return undefined;
}

export function encodeUTF8(str: string) {
	var array: number[] = [],
		i: number,
		c: number;
	for (i = 0; i < str.length; i++) {
		c = str.charCodeAt(i);
		if (c < 0x80) {
			array.push(c);
		} else if (c < 0x800) {
			array.push(0xc0 | (c >> 6));
			array.push(0x80 | (c & 0x3f));
		} else if (c < 0x10000) {
			array.push(0xe0 | (c >> 12));
			array.push(0x80 | ((c >> 6) & 0x3f));
			array.push(0x80 | (c & 0x3f));
		} else {
			array.push(0xf0 | ((c >> 18) & 0x07));
			array.push(0x80 | ((c >> 12) & 0x3f));
			array.push(0x80 | ((c >> 6) & 0x3f));
			array.push(0x80 | (c & 0x3f));
		}
	}
	return array;
}

export function decodeUTF8(array: ArrayLike<number>) {
	var codepoints: number[] = [],
		i: number;
	for (i = 0; i < array.length; i++) {
		if ((array[i] & 0x80) === 0) {
			codepoints.push(array[i] & 0x7f);
		} else if (i + 1 < array.length && (array[i] & 0xe0) === 0xc0 && (array[i + 1] & 0xc0) === 0x80) {
			codepoints.push(((array[i] & 0x1f) << 6) | (array[i + 1] & 0x3f));
		} else if (i + 2 < array.length && (array[i] & 0xf0) === 0xe0 && (array[i + 1] & 0xc0) === 0x80 && (array[i + 2] & 0xc0) === 0x80) {
			codepoints.push(((array[i] & 0x0f) << 12) | ((array[i + 1] & 0x3f) << 6) | (array[i + 2] & 0x3f));
		} else if (
			i + 3 < array.length &&
			(array[i] & 0xf8) === 0xf0 &&
			(array[i + 1] & 0xc0) === 0x80 &&
			(array[i + 2] & 0xc0) === 0x80 &&
			(array[i + 3] & 0xc0) === 0x80
		) {
			codepoints.push(
				((array[i] & 0x07) << 18) | ((array[i + 1] & 0x3f) << 12) | ((array[i + 2] & 0x3f) << 6) | (array[i + 3] & 0x3f)
			);
		}
	}
	return String.fromCharCode.apply(null, codepoints);
}
