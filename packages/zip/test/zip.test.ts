import { describe, test, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileHeader, fileData, dataDescriptor, centralHeader, zip64ExtraField, contentLength, flagNameUTF8 } from "@/zip";
import type { ZipFileDescription, ZipFolderDescription } from "@/input";
import type { Metadata } from "@/metadata";
import { resolve } from "node:path";

const BufferFromHex = (hex: string) => new Uint8Array(Array.from(hex.matchAll(/.{2}/g), ([s]) => Number.parseInt(s, 16)));
const zipSpec = readFileSync(resolve(__dirname, "APPNOTE.TXT"));
const specName = new TextEncoder().encode("APPNOTE.TXT");
const specDate = new Date("2019-04-26T02:00");
const invalidUTF8 = BufferFromHex("fe");

const baseFile: ZipFileDescription & Metadata = Object.freeze({
	isFile: true,
	bytes: new Uint8Array(zipSpec),
	encodedName: specName,
	nameIsBuffer: false,
	modDate: specDate,
	mode: 0o664
});

const baseFolder: ZipFolderDescription & Metadata = Object.freeze({
	isFile: false,
	encodedName: new TextEncoder().encode("folder"),
	nameIsBuffer: false,
	modDate: specDate,
	mode: 0o775
});

class BufferHelper {
	private buffer: Uint8Array;
	private offset: number;

	constructor(estimatedSize = 1024 * 200) {
		this.buffer = new Uint8Array(estimatedSize);
		this.offset = 0;
	}

	writeSync(chunk: Uint8Array): number {
		if (this.offset + chunk.length > this.buffer.length) {
			const newBuffer = new Uint8Array(Math.max(this.buffer.length * 2, this.offset + chunk.length));
			newBuffer.set(this.buffer.subarray(0, this.offset));
			this.buffer = newBuffer;
		}

		this.buffer.set(chunk, this.offset);
		this.offset += chunk.length;
		return chunk.length;
	}

	bytes(options?: { copy?: boolean }): Uint8Array {
		const result = this.buffer.subarray(0, this.offset);
		return options?.copy === false ? result : result.slice();
	}
}

describe("ZIP", () => {
	test("the ZIP fileHeader function makes file headers", () => {
		const file = { ...baseFile };
		const actual = fileHeader(file);
		const expected = BufferFromHex("504b03042d000800000000109a4e0000000000000000000000000b000000");
		expect(actual).toEqual(expected);
	});

	test("the ZIP fileHeader function makes folder headers", () => {
		const folder = { ...baseFolder };
		const actual = fileHeader(folder);
		const expected = BufferFromHex("504b03042d000800000000109a4e00000000000000000000000006000000");
		expect(actual).toEqual(expected);
	});

	test("the ZIP fileHeader function merges extra flags", () => {
		const file = { ...baseFile };
		const actual = fileHeader(file, 0x808);
		const expected = BufferFromHex("504b03042d000808000000109a4e0000000000000000000000000b000000");
		expect(actual).toEqual(expected);
	});

	test("the ZIP fileData function yields all the file's data", async () => {
		const file = { ...baseFile };
		const actual = new BufferHelper(zipSpec.length);
		for await (const chunk of fileData(file)) actual.writeSync(chunk);

		const result = actual.bytes({ copy: false });
		const expected = new Uint8Array(zipSpec);
		expect(result.length).toBe(expected.length);

		// Compare by 8-byte blocks
		const view1 = new DataView(result.buffer, result.byteOffset, result.byteLength);
		const view2 = new DataView(expected.buffer, expected.byteOffset, expected.byteLength);
		const blocks = result.length >>> 3;

		for (let i = 0; i < blocks; i++) {
			const offset = i * 8;
			if (view1.getBigUint64(offset, true) !== view2.getBigUint64(offset, true)) {
				throw new Error(`Data differs at offset ${offset}`);
			}
		}

		for (let i = blocks * 8; i < result.length; i++) {
			expect(result[i]).toBe(expected[i]);
		}
	});

	test("the ZIP fileData function sets the file's size and CRC properties", async () => {
		const file = { ...baseFile };
		expect(file.uncompressedSize).toBe(undefined);
		expect(file.crc).toBe(undefined);
		for await (const _ of fileData(file));
		expect(file.uncompressedSize).toBe(BigInt(zipSpec.length));
		expect(file.crc).toBe(0xbb3afe3f);
	});

	test("the ZIP dataDescriptor function makes data descriptors", () => {
		const file = { ...baseFile, uncompressedSize: 0x10203040n, crc: 0x12345678 };
		const actual = dataDescriptor(file, false);
		const expected = BufferFromHex("504b0708785634124030201040302010");
		expect(actual).toEqual(expected);
	});

	test("the ZIP dataDescriptor function makes ZIP64 data descriptors", () => {
		const file = { ...baseFile, uncompressedSize: 0x110203040n, crc: 0x12345678 };
		const actual = dataDescriptor(file, true);
		const expected = BufferFromHex("504b07087856341240302010010000004030201001000000");
		expect(actual).toEqual(expected);
	});

	test("the ZIP dataDescriptor function makes folder data descriptors", () => {
		const actual = dataDescriptor(baseFolder, false);
		const expected = BufferFromHex("504b0708000000000000000000000000");
		expect(actual).toEqual(expected);
	});

	test("the ZIP centralHeader function makes central record file headers", () => {
		const file = { ...baseFile, uncompressedSize: 0x10203040n, crc: 0x12345678 };
		const offset = 0x01020304n;
		const actual = centralHeader(file, offset, 0);
		const expected = BufferFromHex("504b01022d032d000800000000109a4e7856341240302010403020100b0000000000000000000000b48104030201");
		expect(actual).toEqual(expected);
	});

	test("the ZIP centralHeader function merges extra flags", () => {
		const file = { ...baseFile, uncompressedSize: 0x10203040n, crc: 0x12345678 };
		const offset = 0x01020304n;
		const actual = centralHeader(file, offset, 0x808);
		const expected = BufferFromHex("504b01022d032d000808000000109a4e7856341240302010403020100b0000000000000000000000b48104030201");
		expect(actual).toEqual(expected);
	});

	test("the ZIP centralHeader function makes ZIP64 central record file headers", () => {
		const file = { ...baseFile, uncompressedSize: 0x110203040n, crc: 0x12345678 };
		const offset = 0x101020304n;
		const actual = centralHeader(file, offset, 0, 28);
		const expected = BufferFromHex("504b01022d032d000800000000109a4e78563412ffffffffffffffff0b001c000000000000000000b481ffffffff");
		expect(actual).toEqual(expected);
	});

	test("the ZIP centralHeader function makes central record folder headers", () => {
		const offset = 0x01020304n;
		const actual = centralHeader(baseFolder, offset, 0, 0);
		const expected = BufferFromHex("504b01022d032d000800000000109a4e000000000000000000000000060000000000000000000000fd4104030201");
		expect(actual).toEqual(expected);
	});

	test("the ZIP zip64ExtraField function makes Zip64 extra fields", () => {
		const file = { ...baseFile, uncompressedSize: 0x10203040n, crc: 0x12345678 };
		const offset = 0x01020304n;
		const actual = zip64ExtraField(file, offset, 28);
		const expected = BufferFromHex("01001800403020100000000040302010000000000403020100000000");
		expect(actual).toEqual(expected);
	});

	test("the contentLength function accurately predicts the length of an archive", () => {
		const actual = contentLength([{ uncompressedSize: BigInt(zipSpec.byteLength), encodedName: specName }]);
		const expected = 171462n;
		expect(actual).toBe(expected);
	});

	test("the contentLength function does not throw on zero-length files", () => {
		const actual = contentLength([{ uncompressedSize: 0n, encodedName: specName }]);
		const expected = 136n;
		expect(actual).toBe(expected);
	});

	test("the contentLength function accurately predicts the length of a large archive", () => {
		const actual = contentLength([
			{ uncompressedSize: 0x110203040n, encodedName: specName },
			{ uncompressedSize: BigInt(zipSpec.byteLength), encodedName: specName }
		]);
		const expected = 4565683956n;
		expect(actual).toBe(expected);
	});

	test("the flagNameUTF8 function always turns on bit 11 if the name was not a Buffer", () => {
		const actual = flagNameUTF8({ encodedName: specName, nameIsBuffer: false });
		expect(actual).toBe(0b1000);
		expect(flagNameUTF8({ encodedName: specName, nameIsBuffer: false }, false)).toBe(0b1000);
		expect(flagNameUTF8({ encodedName: specName, nameIsBuffer: false }, true)).toBe(0b1000);
		expect(flagNameUTF8({ encodedName: invalidUTF8, nameIsBuffer: false }, false)).toBe(0b1000);
		expect(flagNameUTF8({ encodedName: invalidUTF8, nameIsBuffer: false }, true)).toBe(0b1000);
	});

	test("the flagNameUTF8 function turns on bit 11 if the name is valid UTF-8", () => {
		const actual = flagNameUTF8({ encodedName: specName, nameIsBuffer: true });
		expect(actual).toBe(0b1000);
	});

	test("the flagNameUTF8 function turns off bit 11 if the name is invalid UTF-8", () => {
		const actual = flagNameUTF8({ encodedName: invalidUTF8, nameIsBuffer: true });
		expect(actual).toBe(0);
	});

	test("the flagNameUTF8 function does whatever the option says about Buffers", () => {
		expect(flagNameUTF8({ encodedName: specName, nameIsBuffer: true }, false)).toBe(0);
		expect(flagNameUTF8({ encodedName: specName, nameIsBuffer: true }, true)).toBe(0b1000);
		expect(flagNameUTF8({ encodedName: invalidUTF8, nameIsBuffer: true }, false)).toBe(0);
		expect(flagNameUTF8({ encodedName: invalidUTF8, nameIsBuffer: true }, true)).toBe(0b1000);
	});
});
