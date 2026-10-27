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

// Flags are written big-endian: 0x0800 is bit 3 (data descriptor), 0x0008 is bit 11 (UTF-8 name).
const dataDescriptorFlag = 0x0800;

const nameDecoder = new TextDecoder();
const utf8Decoder = new TextDecoder("utf8", { fatal: true });

export type ForAwaitable<T> = AsyncIterable<T> | Iterable<T>;

type Zip64FieldLength = 0 | 12 | 28;

const isBig = (n: bigint): boolean => n >= 0xffffffffn;
const zip64FieldLength = (size: bigint, offset: bigint): Zip64FieldLength => (isBig(size) ? 28 : isBig(offset) ? 12 : 0);
const needsZip64End = (hasBigFile: boolean, fileCount: bigint, centralOffset: bigint): boolean =>
	hasBigFile || fileCount >= 0xffffn || isBig(centralOffset);

/** Local header + name + data + optional data descriptor (64-bit sizes for big files). */
const localEntryLength = (nameLength: number, size: bigint, useDataDescriptor: boolean): bigint =>
	BigInt(fileHeaderLength + nameLength + (useDataDescriptor ? descriptorLength + (isBig(size) ? 8 : 0) : 0)) + size;

function sizeOf(file: Omit<Metadata, "nameIsBuffer">): bigint {
	if (file.uncompressedSize === undefined) throw new Error(`Missing size for file "${nameDecoder.decode(file.encodedName)}".`);
	return file.uncompressedSize;
}

export function contentLength(files: Iterable<Omit<Metadata, "nameIsBuffer">>, useDataDescriptor = true): bigint {
	let centralLength = 0n;
	let offset = 0n;
	let fileCount = 0n;
	let hasBigFile = false;

	for (const file of files) {
		const size = sizeOf(file);
		centralLength += BigInt(centralHeaderLength + file.encodedName.length + zip64FieldLength(size, offset));
		offset += localEntryLength(file.encodedName.length, size, useDataDescriptor);
		fileCount++;
		hasBigFile ||= isBig(size);
	}

	const zip64End = needsZip64End(hasBigFile, fileCount, offset) ? zip64endRecordLength + zip64endLocatorLength : 0;
	return offset + centralLength + BigInt(zip64End + endLength);
}

export function flagNameUTF8({ encodedName, nameIsBuffer }: Metadata, buffersAreUTF8?: boolean): number {
	return !nameIsBuffer || (buffersAreUTF8 ?? isUTF8(encodedName)) ? 0b1000 : 0;
}

function isUTF8(bytes: Uint8Array): boolean {
	try {
		utf8Decoder.decode(bytes);
		return true;
	} catch {
		return false;
	}
}

export async function* loadFiles(files: ForAwaitable<ZipEntryDescription & Metadata>, options: Options): AsyncGenerator<Uint8Array> {
	const centralRecord: Uint8Array[] = [];
	let centralSize = 0;
	let offset = 0n;
	let fileCount = 0n;
	let hasBigFile = false;
	const useDataDescriptor = !options.noDataDescriptorForStored;

	for await (const file of files) {
		const flags = flagNameUTF8(file, options.buffersAreUTF8);

		if (file.isFile && !useDataDescriptor) {
			// sizes and CRC go in the local header, so the whole file must be read first
			const chunks = await bufferFileData(file);
			yield fileHeader(file, flags, false);
			yield* chunks;
		} else {
			yield fileHeader(file, flags, useDataDescriptor);
			if (file.isFile) yield* fileData(file);
		}

		const size = sizeOf(file);
		const zip64Length = zip64FieldLength(size, offset);
		if (useDataDescriptor) yield dataDescriptor(file, isBig(size));

		const records = [centralHeader(file, offset, flags, zip64Length, useDataDescriptor), file.encodedName];
		if (zip64Length) records.push(zip64ExtraField(file, offset, zip64Length));
		for (const record of records) {
			centralRecord.push(record);
			centralSize += record.length;
		}

		offset += localEntryLength(file.encodedName.length, size, useDataDescriptor);
		fileCount++;
		hasBigFile ||= isBig(size);
	}

	const zip64 = needsZip64End(hasBigFile, fileCount, offset);
	const output = new Uint8Array(centralSize + (zip64 ? zip64endRecordLength + zip64endLocatorLength : 0) + endLength);
	const view = new DataView(output.buffer);
	let position = 0;
	for (const record of centralRecord) {
		output.set(record, position);
		position += record.length;
	}

	if (zip64) {
		// 4.3.14 Zip64 end of central directory record
		view.setUint32(position, zip64endRecordSignature);
		view.setBigUint64(position + 4, BigInt(zip64endRecordLength - 12), true);
		view.setUint32(position + 12, 0x2d03_2d_00); // UNIX app version 4.5 | ZIP version 4.5
		view.setBigUint64(position + 24, fileCount, true);
		view.setBigUint64(position + 32, fileCount, true);
		view.setBigUint64(position + 40, BigInt(centralSize), true);
		view.setBigUint64(position + 48, offset, true);
		// 4.3.15 Zip64 end of central directory locator
		view.setUint32(position + 56, zip64endLocatorSignature);
		view.setBigUint64(position + 64, offset + BigInt(centralSize), true);
		view.setUint32(position + 72, 1, true);
		position += zip64endRecordLength + zip64endLocatorLength;
	}

	view.setUint32(position, endSignature);
	view.setUint16(position + 8, clampInt16(fileCount), true);
	view.setUint16(position + 10, clampInt16(fileCount), true);
	view.setUint32(position + 12, clampInt32(BigInt(centralSize)), true);
	view.setUint32(position + 16, clampInt32(offset), true);
	yield output;
}

/** Local file header followed by the file name. */
export function fileHeader(file: ZipEntryDescription & Metadata, flags = 0, useDataDescriptor = true): Uint8Array {
	const output = new Uint8Array(fileHeaderLength + file.encodedName.length);
	const header = new DataView(output.buffer);
	header.setUint32(0, fileHeaderSignature);
	header.setUint32(4, 0x2d_00_0000 | (useDataDescriptor ? dataDescriptorFlag : 0) | flags); // ZIP version 4.5 | flags
	formatDOSDateTime(file.modDate, header, 10);

	if (!useDataDescriptor) {
		const size = clampInt32(file.uncompressedSize ?? 0n);
		header.setUint32(14, file.isFile ? (file.crc ?? 0) : 0, true);
		header.setUint32(18, size, true);
		header.setUint32(22, size, true);
	}

	header.setUint16(26, file.encodedName.length, true);
	output.set(file.encodedName, fileHeaderLength);
	return output;
}

async function bufferFileData(file: ZipFileDescription & Metadata): Promise<Uint8Array[]> {
	const chunks: Uint8Array[] = [];
	for await (const chunk of fileData(file)) chunks.push(chunk);
	return chunks;
}

/** Yields the file content while computing its CRC and size. */
export async function* fileData(file: ZipFileDescription & Metadata): AsyncGenerator<Uint8Array> {
	const { bytes } = file;
	if (bytes instanceof Uint8Array) {
		yield bytes;
		file.crc = crc32(bytes, 0);
		file.uncompressedSize = BigInt(bytes.length);
		return;
	}

	let crc = 0;
	let size = 0;
	const reader = bytes.getReader();
	for (;;) {
		const { value, done } = await reader.read();
		if (done) break;
		crc = crc32(value, crc);
		size += value.length;
		yield value;
	}
	file.crc = crc;
	file.uncompressedSize = BigInt(size);
}

export function dataDescriptor(file: ZipEntryDescription & Metadata, needsZip64: boolean): Uint8Array {
	const header = makeBuffer(descriptorLength + (needsZip64 ? 8 : 0));
	const size = file.uncompressedSize ?? 0n;
	header.setUint32(0, descriptorSignature);
	header.setUint32(4, file.isFile ? (file.crc ?? 0) : 0, true);
	if (needsZip64) {
		header.setBigUint64(8, size, true);
		header.setBigUint64(16, size, true);
	} else {
		header.setUint32(8, clampInt32(size), true);
		header.setUint32(12, clampInt32(size), true);
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
	const size = clampInt32(file.uncompressedSize ?? 0n);
	header.setUint32(0, centralHeaderSignature);
	header.setUint32(4, 0x2d03_2d_00); // UNIX app version 4.5 | ZIP version 4.5
	header.setUint16(8, (useDataDescriptor ? dataDescriptorFlag : 0) | flags);
	// compression method stays 0 (stored)
	formatDOSDateTime(file.modDate, header, 12);
	header.setUint32(16, file.isFile ? (file.crc ?? 0) : 0, true);
	header.setUint32(20, size, true);
	header.setUint32(24, size, true);
	header.setUint16(28, file.encodedName.length, true);
	header.setUint16(30, zip64HeaderLength, true);
	header.setUint16(40, file.mode | (file.isFile ? 0o100000 : 0o040000), true);
	header.setUint32(42, clampInt32(offset), true);
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
	if (zip64HeaderLength === 28) {
		const size = file.uncompressedSize ?? 0n;
		header.setBigUint64(4, size, true);
		header.setBigUint64(12, size, true);
	}
	header.setBigUint64(zip64HeaderLength - 8, offset, true);
	return makeUint8Array(header);
}
