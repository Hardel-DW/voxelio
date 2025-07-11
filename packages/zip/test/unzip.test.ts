import { describe, test, expect } from "vitest";
import { extractZip, makeZip } from "@/index";
import { filesRecord, filesRecordWithInvalidPackMcmeta, filesRecordWithoutPackMcmeta } from "@test/mock/zip";

// Helper to create a Zip file from a Record<string, Uint8Array>
async function createZipFromFiles(files: Record<string, Uint8Array>): Promise<Uint8Array> {
	// Convert record to array of entries with appropriate format for makeZip
	const entries = Object.entries(files).map(([name, content]) => ({
		name,
		input: content
	}));

	// Create a zip file
	const zipStream = makeZip(entries);

	// Read the entire stream into a Uint8Array
	const reader = zipStream.getReader();
	const chunks: Uint8Array[] = [];
	let totalLength = 0;

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		chunks.push(value);
		totalLength += value.length;
	}

	// Combine all chunks into a single Uint8Array
	const result = new Uint8Array(totalLength);
	let offset = 0;
	for (const chunk of chunks) {
		result.set(chunk, offset);
		offset += chunk.length;
	}

	return result;
}

describe("extractZip", () => {
	test("extractZip correctly extracts files from a zip", async () => {
		// Create a zip file from the mock data
		const zipData = await createZipFromFiles(filesRecord);

		// Extract the files from the zip
		const extractedFiles = await extractZip(zipData);

		// Verify the number of files
		expect(Object.keys(extractedFiles).length).toBe(Object.keys(filesRecord).length);

		// Verify each file's content
		for (const [name, expectedContent] of Object.entries(filesRecord)) {
			expect(extractedFiles[name]).toBeDefined();
			expect(extractedFiles[name]).toEqual(expectedContent);
		}
	});

	test("extractZip handles zip with invalid pack.mcmeta", async () => {
		// Create a zip file with invalid pack.mcmeta
		const zipData = await createZipFromFiles(filesRecordWithInvalidPackMcmeta);

		// Extract the files from the zip
		const extractedFiles = await extractZip(zipData);

		// Verify the number of files
		expect(Object.keys(extractedFiles).length).toBe(Object.keys(filesRecordWithInvalidPackMcmeta).length);

		// Verify the content of pack.mcmeta specifically
		expect(extractedFiles["pack.mcmeta"]).toBeDefined();
		expect(new TextDecoder().decode(extractedFiles["pack.mcmeta"])).toBe(JSON.stringify({ pack: {} }, null, 2));

		// Verify other files
		for (const [name, expectedContent] of Object.entries(filesRecordWithInvalidPackMcmeta)) {
			if (name === "pack.mcmeta") continue; // Already checked

			expect(extractedFiles[name]).toBeDefined();
			expect(extractedFiles[name]).toEqual(expectedContent);
		}
	});

	test("extractZip handles zip without pack.mcmeta", async () => {
		// Create a zip file without pack.mcmeta
		const zipData = await createZipFromFiles(filesRecordWithoutPackMcmeta);

		// Extract the files from the zip
		const extractedFiles = await extractZip(zipData);

		// Verify the number of files
		expect(Object.keys(extractedFiles).length).toBe(Object.keys(filesRecordWithoutPackMcmeta).length);

		// Verify each file's content
		for (const [name, expectedContent] of Object.entries(filesRecordWithoutPackMcmeta)) {
			expect(extractedFiles[name]).toBeDefined();
			expect(extractedFiles[name]).toEqual(expectedContent);
		}
	});

	test("extractZip handles empty file paths", async () => {
		const mockWithEmptyPath = {
			"": new TextEncoder().encode("empty path content"),
			"file.txt": new TextEncoder().encode("regular file content")
		};

		try {
			await createZipFromFiles(mockWithEmptyPath);
			throw new Error("makeZip should throw an error for empty file paths");
		} catch (error) {
			expect(error).toBeDefined();
			const errorMessage = String(error);
			expect(errorMessage.includes("must have a name")).toBe(true);
		}
	});

	test("extractZip handles special characters in file names", async () => {
		// Create mock data with special characters in file names
		const mockWithSpecialChars = {
			"special-&é\"'(§è!çà)chars.txt": new TextEncoder().encode("special chars content"),
			"unicode-😀🚀🌍.txt": new TextEncoder().encode("unicode content")
		};

		// Create a zip file
		const zipData = await createZipFromFiles(mockWithSpecialChars);

		// Extract the files from the zip
		const extractedFiles = await extractZip(zipData);

		// Verify each file's content
		for (const [name, expectedContent] of Object.entries(mockWithSpecialChars)) {
			expect(extractedFiles[name]).toBeDefined();
			expect(extractedFiles[name]).toEqual(expectedContent);
		}
	});

	test("extractZip can handle larger files", async () => {
		// Create a larger file (1MB)
		const largeContent = new Uint8Array(1024 * 1024);
		// Fill with some pattern for verification
		for (let i = 0; i < largeContent.length; i++) {
			largeContent[i] = i % 256;
		}

		const mockLargeFile = {
			"large-file.bin": largeContent
		};

		// Create a zip file
		const zipData = await createZipFromFiles(mockLargeFile);

		// Extract the files from the zip
		const extractedFiles = await extractZip(zipData);

		// Verify the content
		expect(extractedFiles["large-file.bin"]).toBeDefined();
		expect(extractedFiles["large-file.bin"]).toEqual(largeContent);
	});
});
