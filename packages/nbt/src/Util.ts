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
