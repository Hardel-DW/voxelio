import { crc32 } from "@/crc32";
import { formatDOSDateTime } from "@/datetime";
import type { Options } from "@/index";
import type { ZipEntryDescription, ZipFileDescription } from "@/input";
import type { Metadata } from "@/metadata";
import { clampInt16, clampInt32, makeBuffer, makeUint8Array } from "@/utils";

const fileHeaderSignature = 0x504b_0304;
const fileHeaderLength = 30;
const descriptorSignature = 0x504b_0708;
const descriptorLength = 16;
const centralHeaderSignature = 0x504b_0102;
const centralHeaderLength = 46;
const endSignature = 0x504b_0506;
const endLength = 22;
const zip64endRecordSignature = 0x504b_0606;
const zip64endRecordLength = 56;
const zip64endLocatorSignature = 0x504b_0607;
const zip64endLocatorLength = 20;

export type ForAwaitable<T> = AsyncIterable<T> | Iterable<T>;

type Zip64FieldLength = 0 | 12 | 28;

export function contentLength(files: Iterable<Omit<Metadata, "nameIsBuffer">>, useDataDescriptor = true): bigint {
	let centralLength = BigInt(endLength);
	let offset = 0n;
	let archiveNeedsZip64 = false;
	const descriptorSize = useDataDescriptor ? descriptorLength : 0;

	for (const file of files) {
		if (!file.encodedName) {
			throw new Error("Every file must have a non-empty name.");
		}
		if (file.uncompressedSize === undefined) {
			throw new Error(`Missing size for file "${new TextDecoder().decode(file.encodedName)}".`);
		}
		const bigFile = file.uncompressedSize >= 0xffffffffn;
		const bigOffset = offset >= 0xffffffffn;
		const bigFileExtra = bigFile && useDataDescriptor ? 8 : 0;
		offset += BigInt(fileHeaderLength + descriptorSize + file.encodedName.length + bigFileExtra) + file.uncompressedSize;
		centralLength += BigInt(file.encodedName.length + centralHeaderLength + ((bigOffset ? 12 : 0) | (bigFile ? 28 : 0)));
		archiveNeedsZip64 ||= bigFile;
	}
	if (archiveNeedsZip64 || offset >= 0xffffffffn) {
		centralLength += BigInt(zip64endRecordLength + zip64endLocatorLength);
	}
	return centralLength + offset;
}

export function flagNameUTF8({ encodedName, nameIsBuffer }: Metadata, buffersAreUTF8?: boolean): number {
	// @ts-expect-error: This is a valid use of BigInt
	return (!nameIsBuffer || (buffersAreUTF8 ?? tryUTF8(encodedName))) * 0b1000;
}
const UTF8Decoder = new TextDecoder("utf8", { fatal: true });
function tryUTF8(str: Uint8Array) {
	try {
		UTF8Decoder.decode(str);
	} catch {
		return false;
	}
	return true;
}

export async function* loadFiles(files: ForAwaitable<ZipEntryDescription & Metadata>, options: Options): AsyncIterable<Uint8Array> {
	const centralRecord: Uint8Array[] = [];
	let offset = 0n;
	let fileCount = 0n;
	let archiveNeedsZip64 = false;
	const useDataDescriptor = !options.noDataDescriptorForStored;

	for await (const file of files) {
		let bufferedChunks: Uint8Array[] | undefined;

		if (!useDataDescriptor && file.isFile) {
			bufferedChunks = await bufferAndComputeMetadata(file);
		}

		const flags = flagNameUTF8(file, options.buffersAreUTF8);
		yield fileHeader(file, flags, useDataDescriptor);
		yield new Uint8Array(file.encodedName);

		if (file.isFile) {
			if (bufferedChunks) {
				for (const chunk of bufferedChunks) yield chunk;
			} else {
				yield* fileData(file);
			}
		}

		if (file.uncompressedSize === undefined) {
			throw new Error(`Missing size for file "${new TextDecoder().decode(file.encodedName)}".`);
		}

		const bigFile = file.uncompressedSize >= 0xffffffffn;
		const bigOffset = offset >= 0xffffffffn;
		const zip64HeaderLength = ((Number(bigOffset) * 12) | (Number(bigFile) * 28)) as Zip64FieldLength;

		if (useDataDescriptor) yield dataDescriptor(file, bigFile);
		centralRecord.push(centralHeader(file, offset, flags, zip64HeaderLength, useDataDescriptor));
		centralRecord.push(file.encodedName);
		if (zip64HeaderLength) {
			centralRecord.push(zip64ExtraField(file, offset, zip64HeaderLength));
		}
		if (bigFile && useDataDescriptor) offset += 8n; // because the data descriptor will have 64-bit sizes
		fileCount++;
		if (file.encodedName.length === 0) {
			throw new Error("Every file must have a non-empty name.");
		}
		const descriptorSize = useDataDescriptor ? descriptorLength : 0;
		offset += BigInt(fileHeaderLength + descriptorSize + file.encodedName.length) + file.uncompressedSize;
		archiveNeedsZip64 ||= bigFile;
	}

	// write central repository
	let centralSize = 0n;
	for (const record of centralRecord) {
		yield record;
		centralSize += BigInt(record.length);
	}

	if (archiveNeedsZip64 || offset >= 0xffffffffn) {
		const endZip64 = makeBuffer(zip64endRecordLength + zip64endLocatorLength);
		// 4.3.14 Zip64 end of central directory record
		endZip64.setUint32(0, zip64endRecordSignature);
		endZip64.setBigUint64(4, BigInt(zip64endRecordLength - 12), true);
		endZip64.setUint32(12, 0x2d03_2d_00); // UNIX app version 4.5 | ZIP version 4.5
		// leave 8 bytes at zero
		endZip64.setBigUint64(24, fileCount, true);
		endZip64.setBigUint64(32, fileCount, true);
		endZip64.setBigUint64(40, centralSize, true);
		endZip64.setBigUint64(48, offset, true);

		// 4.3.15 Zip64 end of central directory locator
		endZip64.setUint32(56, zip64endLocatorSignature);
		// leave 4 bytes at zero
		endZip64.setBigUint64(64, offset + centralSize, true);
		endZip64.setUint32(72, 1, true);
		yield makeUint8Array(endZip64);
	}

	const end = makeBuffer(endLength);
	end.setUint32(0, endSignature);
	// skip 4 useless bytes here
	end.setUint16(8, clampInt16(fileCount), true);
	end.setUint16(10, clampInt16(fileCount), true);
	end.setUint32(12, clampInt32(centralSize), true);
	end.setUint32(16, clampInt32(offset), true);
	// leave comment length = zero (2 bytes)
	yield makeUint8Array(end);
}

export function fileHeader(file: ZipEntryDescription & Metadata, flags = 0, useDataDescriptor = true): Uint8Array {
	const header = makeBuffer(fileHeaderLength);
	header.setUint32(0, fileHeaderSignature);

	// Bit 3 controls data descriptor: enabled by default, but can be disabled for Forge/Java compatibility
	const descriptorFlag = useDataDescriptor ? 0x0800 : 0x0000;
	header.setUint32(4, 0x2d_00_0000 | descriptorFlag | flags); // ZIP version 4.5 | flags
	formatDOSDateTime(file.modDate, header, 10);

	if (!useDataDescriptor) {
		header.setUint32(14, file.isFile ? (file.crc ?? 0) : 0, true);
		header.setUint32(18, clampInt32(file.uncompressedSize ?? 0n), true);
		header.setUint32(22, clampInt32(file.uncompressedSize ?? 0n), true);
	}

	header.setUint16(26, file.encodedName.length, true);
	// leave extra field length = zero (2 bytes)
	return makeUint8Array(header);
}

function computeMetadataFromBuffer(file: ZipFileDescription & Metadata, buffer: Uint8Array): void {
	file.crc = crc32(buffer, 0);
	file.uncompressedSize = BigInt(buffer.length);
}

function computeMetadataFromChunk(file: ZipFileDescription & Metadata, chunk: Uint8Array): void {
	file.crc = crc32(chunk, file.crc);
	file.uncompressedSize = (file.uncompressedSize ?? 0n) + BigInt(chunk.length);
}

async function bufferAndComputeMetadata(file: ZipFileDescription & Metadata): Promise<Uint8Array[]> {
	let { bytes } = file;
	if ("then" in bytes) bytes = await bytes;

	if (bytes instanceof Uint8Array) {
		computeMetadataFromBuffer(file, bytes);
		return [bytes];
	}

	file.uncompressedSize = 0n;
	const chunks: Uint8Array[] = [];
	const reader = bytes.getReader();

	for (;;) {
		const { value, done } = await reader.read();
		if (done) break;
		if (!value) continue;

		computeMetadataFromChunk(file, value);
		chunks.push(value);
	}

	return chunks;
}

export async function* fileData(file: ZipFileDescription & Metadata): AsyncIterable<Uint8Array> {
	let { bytes } = file;
	if ("then" in bytes) bytes = await bytes;

	if (bytes instanceof Uint8Array) {
		yield bytes;
		computeMetadataFromBuffer(file, bytes);
		return;
	}

	file.uncompressedSize = 0n;
	const reader = bytes.getReader();

	for (;;) {
		const { value, done } = await reader.read();
		if (done) break;
		if (!value) continue;

		computeMetadataFromChunk(file, value);
		yield value;
	}
}

export function dataDescriptor(file: ZipEntryDescription & Metadata, needsZip64: boolean): Uint8Array {
	const header = makeBuffer(descriptorLength + (needsZip64 ? 8 : 0));
	header.setUint32(0, descriptorSignature);
	header.setUint32(4, file.isFile ? (file.crc ?? 0) : 0, true);
	if (needsZip64) {
		// Use default value of 0n if uncompressedSize is undefined
		const uncompressedSize = file.uncompressedSize ?? BigInt(0);
		header.setBigUint64(8, uncompressedSize, true);
		header.setBigUint64(16, uncompressedSize, true);
	} else {
		const uncompressedSize = file.uncompressedSize ?? BigInt(0);
		header.setUint32(8, clampInt32(uncompressedSize), true);
		header.setUint32(12, clampInt32(uncompressedSize), true);
	}
	return makeUint8Array(header);
}

export function centralHeader(
	file: ZipEntryDescription & Metadata,
	offset: bigint,
	flags = 0,
	zip64HeaderLength: Zip64FieldLength = 0,
	useDataDescriptor = true
): Uint8Array {
	const header = makeBuffer(centralHeaderLength);
	header.setUint32(0, centralHeaderSignature);
	header.setUint32(4, 0x2d03_2d_00); // UNIX app version 4.5 | ZIP version 4.5

	const descriptorFlag = useDataDescriptor ? 0x0800 : 0x0000;
	header.setUint16(8, descriptorFlag | flags); // flags
	// leave compression = zero (2 bytes) until we implement compression
	formatDOSDateTime(file.modDate, header, 12);
	header.setUint32(16, file.isFile ? (file.crc ?? 0) : 0, true);
	header.setUint32(20, clampInt32(file.uncompressedSize ?? 0n), true);
	header.setUint32(24, clampInt32(file.uncompressedSize ?? 0n), true);
	header.setUint16(28, file.encodedName.length, true);
	header.setUint16(30, zip64HeaderLength, true);
	// useless disk fields = zero (4 bytes)
	// useless attributes = zero (4 bytes)
	header.setUint16(40, file.mode | (file.isFile ? 0o100000 : 0o040000), true);
	header.setUint32(42, clampInt32(offset), true); // offset
	return makeUint8Array(header);
}

export function zip64ExtraField(
	file: ZipEntryDescription & Metadata,
	offset: bigint,
	zip64HeaderLength: Exclude<Zip64FieldLength, 0>
): Uint8Array {
	const header = makeBuffer(zip64HeaderLength);
	header.setUint16(0, 1, true);
	header.setUint16(2, zip64HeaderLength - 4, true);
	if (zip64HeaderLength & 16) {
		// Use default value of 0n if uncompressedSize is undefined
		const uncompressedSize = file.uncompressedSize ?? BigInt(0);
		header.setBigUint64(4, uncompressedSize, true);
		header.setBigUint64(12, uncompressedSize, true);
	}
	header.setBigUint64(zip64HeaderLength - 8, offset, true);
	return makeUint8Array(header);
}
