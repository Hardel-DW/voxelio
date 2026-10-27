const fileHeaderSignature = 0x504b_0304;
const fileHeaderLength = 30;
const centralHeaderSignature = 0x504b_0102;
const centralHeaderLength = 46;
const endLength = 22;
const zip64endRecordSignature = 0x504b_0606;
const zip64endLocatorSignature = 0x504b_0607;
const zip64endLocatorLength = 20;

const COMPRESSION_STORED = 0;
const COMPRESSION_DEFLATE = 8;

const utf8Decoder = new TextDecoder("utf-8");
// WHATWG maps "ascii" to windows-1252
const legacyDecoder = new TextDecoder("ascii");

type Entry = { name: string; method: number; content: Uint8Array };

/**
 * Extracts files from a ZIP using a Uint8Array.
 * Stored entries are views over `data`, not copies.
 * @param data The ZIP file content as a Uint8Array
 * @returns An object containing file paths and their contents
 */
export async function extractZip(data: Uint8Array): Promise<Record<string, Uint8Array>> {
	const entries = readEntries(data);
	const files = await Promise.all(
		entries.map(async ({ name, method, content }) => [name, await decompress(name, method, content)] as const)
	);
	// fromEntries keeps a "__proto__" entry as an own property
	return Object.fromEntries(files);
}

function readEntries(data: Uint8Array): Entry[] {
	const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
	const end = findEndOfCentralDirectory(data);
	if (end === -1) throw new Error("Invalid ZIP file: End of Central Directory Record not found");

	let entryCount = view.getUint16(end + 10, true);
	let offset = view.getUint32(end + 16, true);
	const locator = end - zip64endLocatorLength;
	if ((entryCount === 0xffff || offset === 0xffffffff) && locator >= 0 && view.getUint32(locator) === zip64endLocatorSignature) {
		const record = Number(view.getBigUint64(locator + 8, true));
		if (view.getUint32(record) === zip64endRecordSignature) {
			entryCount = Number(view.getBigUint64(record + 32, true));
			offset = Number(view.getBigUint64(record + 48, true));
		}
	}

	const entries: Entry[] = [];
	for (let i = 0; i < entryCount; i++) {
		if (view.getUint32(offset) !== centralHeaderSignature) throw new Error(`Invalid central directory header at offset ${offset}`);

		const nameLength = view.getUint16(offset + 28, true);
		const extraLength = view.getUint16(offset + 30, true);
		const commentLength = view.getUint16(offset + 32, true);
		const nameStart = offset + centralHeaderLength;
		const decoder = view.getUint16(offset + 8, true) & 0x0800 ? utf8Decoder : legacyDecoder;
		const name = decoder.decode(data.subarray(nameStart, nameStart + nameLength));
		const header = offset;
		offset = nameStart + nameLength + extraLength + commentLength;
		if (name.endsWith("/")) continue;

		const method = view.getUint16(header + 10, true);
		if (method !== COMPRESSION_STORED && method !== COMPRESSION_DEFLATE) {
			throw new Error(`Unsupported compression method: ${method} for file ${name}`);
		}

		const sizes = readSizes(view, header, nameStart + nameLength, extraLength);
		if (view.getUint32(sizes.localHeaderOffset) !== fileHeaderSignature) {
			throw new Error(`Invalid local file header at offset ${sizes.localHeaderOffset}`);
		}

		const localNameLength = view.getUint16(sizes.localHeaderOffset + 26, true);
		const localExtraLength = view.getUint16(sizes.localHeaderOffset + 28, true);
		const start = sizes.localHeaderOffset + fileHeaderLength + localNameLength + localExtraLength;
		const length = method === COMPRESSION_STORED ? sizes.uncompressedSize : sizes.compressedSize;
		if (start + length > data.length) throw new Error(`Invalid ZIP file: ${name} exceeds the archive`);

		entries.push({ name, method, content: data.subarray(start, start + length) });
	}
	return entries;
}

/** Reads sizes and local header offset, following the ZIP64 extra field when a value is 0xFFFFFFFF. */
function readSizes(view: DataView, header: number, extraStart: number, extraLength: number) {
	let compressedSize = view.getUint32(header + 20, true);
	let uncompressedSize = view.getUint32(header + 24, true);
	let localHeaderOffset = view.getUint32(header + 42, true);
	if (compressedSize !== 0xffffffff && uncompressedSize !== 0xffffffff && localHeaderOffset !== 0xffffffff) {
		return { compressedSize, uncompressedSize, localHeaderOffset };
	}

	const extraEnd = extraStart + extraLength;
	for (let extra = extraStart; extra + 4 <= extraEnd; extra += 4 + view.getUint16(extra + 2, true)) {
		if (view.getUint16(extra, true) !== 1) continue;

		// ZIP64 fields only exist for values set to 0xFFFFFFFF, in this order
		let field = extra + 4;
		if (uncompressedSize === 0xffffffff && field + 8 <= extraEnd) {
			uncompressedSize = Number(view.getBigUint64(field, true));
			field += 8;
		}
		if (compressedSize === 0xffffffff && field + 8 <= extraEnd) {
			compressedSize = Number(view.getBigUint64(field, true));
			field += 8;
		}
		if (localHeaderOffset === 0xffffffff && field + 8 <= extraEnd) {
			localHeaderOffset = Number(view.getBigUint64(field, true));
		}
		break;
	}
	return { compressedSize, uncompressedSize, localHeaderOffset };
}

async function decompress(name: string, method: number, content: Uint8Array): Promise<Uint8Array> {
	if (method === COMPRESSION_STORED) return content;
	try {
		return await inflate(content);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(`Failed to decompress ${name}: ${message}`, { cause: error });
	}
}

async function inflate(compressed: Uint8Array): Promise<Uint8Array> {
	const stream = new DecompressionStream("deflate-raw");
	const writer = stream.writable.getWriter();
	// slice: BufferSource must be ArrayBuffer-backed. Awaited together so corrupt data rejects here, not as an unhandled rejection.
	const [, chunks] = await Promise.all([writer.write(compressed.slice()).then(() => writer.close()), readAll(stream.readable)]);
	// always copy: output chunks may be views over larger pooled buffers
	const result = new Uint8Array(chunks.reduce((total, chunk) => total + chunk.length, 0));
	let offset = 0;
	for (const chunk of chunks) {
		result.set(chunk, offset);
		offset += chunk.length;
	}
	return result;
}

async function readAll(stream: ReadableStream<Uint8Array>): Promise<Uint8Array[]> {
	const chunks: Uint8Array[] = [];
	const reader = stream.getReader();
	for (;;) {
		const { value, done } = await reader.read();
		if (done) return chunks;
		chunks.push(value);
	}
}

/** Scans backwards: the record may be followed by a comment of up to 65535 bytes. */
function findEndOfCentralDirectory(data: Uint8Array): number {
	const stop = Math.max(0, data.length - 0xffff - endLength);
	for (let i = data.length - endLength; i >= stop; i--) {
		if (data[i] === 0x50 && data[i + 1] === 0x4b && data[i + 2] === 0x05 && data[i + 3] === 0x06) return i;
	}
	return -1;
}
