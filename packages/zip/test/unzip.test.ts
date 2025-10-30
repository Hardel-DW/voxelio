import { describe, test, expect } from "vitest";
import { extractZip, makeZip } from "@/index";

function expectUint8ArrayEqual(actual: Uint8Array, expected: Uint8Array) {
	expect(actual.length).toBe(expected.length);

	const len = actual.length;
	const blocks = len >>> 3;
	let i = 0;

	if (blocks > 0) {
		const viewA = new DataView(actual.buffer, actual.byteOffset, actual.byteLength);
		const viewB = new DataView(expected.buffer, expected.byteOffset, expected.byteLength);

		for (let b = 0; b < blocks; b++) {
			const offset = i;
			if (viewA.getBigUint64(offset, true) !== viewB.getBigUint64(offset, true)) {
				throw new Error(`Arrays differ at byte ${offset}`);
			}
			i += 8;
		}
	}

	for (; i < len; i++) {
		if (actual[i] !== expected[i]) {
			throw new Error(`Arrays differ at byte ${i}: ${actual[i]} !== ${expected[i]}`);
		}
	}
}

async function createZipFromFiles(files: Record<string, Uint8Array>): Promise<Uint8Array> {
	const entries = Object.entries(files).map(([name, input]) => ({ name, input }));
	const zipStream = makeZip(entries);
	const reader = zipStream.getReader();
	let buffer = new Uint8Array(Object.values(files).reduce((sum, f) => sum + f.length, 0) * 2);
	let offset = 0;

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;

		if (offset + value.length > buffer.length) {
			const newBuffer = new Uint8Array(Math.max(buffer.length * 2, offset + value.length));
			newBuffer.set(buffer.subarray(0, offset));
			buffer = newBuffer;
		}

		buffer.set(value, offset);
		offset += value.length;
	}

	return buffer.subarray(0, offset);
}

describe("extractZip", () => {
	test("extractZip correctly extracts files from a zip", async () => {
		const testFiles = {
			"file1.txt": new TextEncoder().encode("Hello World"),
			"file2.txt": new TextEncoder().encode("Test content")
		};

		const zipData = await createZipFromFiles(testFiles);
		const extractedFiles = await extractZip(zipData);
		expect(Object.keys(extractedFiles).length).toBe(Object.keys(testFiles).length);
		for (const [name, expectedContent] of Object.entries(testFiles)) {
			expect(extractedFiles[name]).toBeDefined();
			expectUint8ArrayEqual(extractedFiles[name], expectedContent);
		}
	});

	test("extractZip handles empty file paths", async () => {
		const mockWithEmptyPath = {
			"": new TextEncoder().encode("empty path content"),
			"file.txt": new TextEncoder().encode("regular file content")
		};

		await expect(createZipFromFiles(mockWithEmptyPath)).rejects.toThrow("must have a name");
	});

	test("extractZip handles special characters in file names", async () => {
		const mockWithSpecialChars = {
			"special-&é\"'(§è!çà)chars.txt": new TextEncoder().encode("special chars content"),
			"unicode-😀🚀🌍.txt": new TextEncoder().encode("unicode content")
		};

		const zipData = await createZipFromFiles(mockWithSpecialChars);
		const extractedFiles = await extractZip(zipData);
		for (const [name, expectedContent] of Object.entries(mockWithSpecialChars)) {
			expect(extractedFiles[name]).toBeDefined();
			expectUint8ArrayEqual(extractedFiles[name], expectedContent);
		}
	});

	test("extractZip can handle larger files", async () => {
		const largeContent = new Uint8Array(1024 * 1024);
		for (let i = 0; i < largeContent.length; i++) {
			largeContent[i] = i % 256;
		}

		const mockLargeFile = {
			"large-file.bin": largeContent
		};

		const zipData = await createZipFromFiles(mockLargeFile);
		const extractedFiles = await extractZip(zipData);
		expect(extractedFiles["large-file.bin"]).toBeDefined();
		expectUint8ArrayEqual(extractedFiles["large-file.bin"], largeContent);
	});
});
