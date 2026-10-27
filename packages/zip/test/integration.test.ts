import { describe, test, expect } from "vitest";
import { readFileSync } from "node:fs";
import { downloadZip, predictLength } from "@/index";
import { extractZip } from "@/unzip";
import { resolve } from "node:path";

const zipSpec = readFileSync(resolve(__dirname, "APPNOTE.TXT"));
const specName = new TextEncoder().encode("APPNOTE.TXT");
const specDate = new Date("2019-04-26T02:00");

describe("downloadZip", () => {
	test("downloadZip propagates pulling and cancellation", async () => {
		const thrown: unknown[] = [];
		let pulled = 0;
		const input: {
			next(): IteratorResult<{ input: Uint8Array; name: Uint8Array; lastModified: Date }>;
			throw(err: unknown): IteratorResult<any>;
			[Symbol.iterator](): any;
		} = {
			next() {
				if (pulled++ >= 10) return { done: true, value: undefined };
				return {
					done: false,
					value: {
						input: new Uint8Array(zipSpec),
						name: new Uint8Array(specName),
						lastModified: specDate
					}
				};
			},
			throw(err: unknown) {
				thrown.push(err);
				return { done: true, value: undefined };
			},
			[Symbol.iterator]() {
				return this;
			}
		};
		const response = downloadZip(input);
		// Check if body exists before getting reader
		if (!response.body) {
			throw new Error("Response body is null or undefined");
		}
		const reader = response.body.getReader();

		// it does not pull from its input until someone reads the output
		expect(pulled).toBe(0);

		// it pulls lazily from the input iterable: header, data, then descriptor and next header
		for (let i = 0; i < 2; i++) await reader.read();
		expect(pulled).toBe(1);
		for (let i = 0; i < 2; i++) await reader.read();
		expect(pulled).toBe(2);
		expect(thrown.length).toBe(0);

		// it cancels the input iterable when its output is cancelled
		const error = new Error("I don't want to ZIP anymore !");
		await reader.cancel(error);
		expect(thrown.length).toBe(1);
		expect(thrown[0]).toBe(error);
	});

	test("downloadZip with noDataDescriptorForStored creates valid JAR-compatible archives", async () => {
		const testContent = new TextEncoder().encode("Hello from JAR test!");
		const testFile = {
			name: "test.txt",
			input: testContent,
			lastModified: new Date("2024-01-01T00:00:00Z")
		};

		const response = downloadZip([testFile], { noDataDescriptorForStored: true });
		const arrayBuffer = await response.arrayBuffer();
		const zipData = new Uint8Array(arrayBuffer);
		const extracted = await extractZip(zipData);
		expect(extracted["test.txt"]).toBeDefined();
		expect(new TextDecoder().decode(extracted["test.txt"])).toBe("Hello from JAR test!");

		let localHeaderOffset = 0;
		for (let i = 0; i < zipData.length - 3; i++) {
			if (zipData[i] === 0x50 && zipData[i + 1] === 0x4b && zipData[i + 2] === 0x03 && zipData[i + 3] === 0x04) {
				localHeaderOffset = i;
				break;
			}
		}

		const flagsOffset = localHeaderOffset + 6;
		const flags = new DataView(zipData.buffer, zipData.byteOffset, zipData.byteLength).getUint16(flagsOffset, true);
		expect(flags & 0x0008).toBe(0);

		const crcOffset = localHeaderOffset + 14;
		const crc = new DataView(zipData.buffer, zipData.byteOffset, zipData.byteLength).getUint32(crcOffset, true);
		expect(crc).not.toBe(0);

		const sizeOffset = localHeaderOffset + 18;
		const size = new DataView(zipData.buffer, zipData.byteOffset, zipData.byteLength).getUint32(sizeOffset, true);
		expect(size).toBe(testContent.length);
	});
});

describe("regressions", () => {
	const zipOf = async (files: Parameters<typeof downloadZip>[0]) => new Uint8Array(await downloadZip(files).arrayBuffer());
	const date = new Date("2024-01-01T00:00:00");

	test("ArrayBufferView inputs only zip their own window", async () => {
		const buffer = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).buffer;
		const extracted = await extractZip(await zipOf([{ name: "view", input: new Uint16Array(buffer, 2, 1), lastModified: date }]));
		expect([...extracted.view]).toEqual([3, 4]);
	});

	test("empty chunks do not end async iterable inputs", async () => {
		async function* chunks() {
			yield "ab";
			yield "";
			yield "cd";
		}
		const extracted = await extractZip(await zipOf([{ name: "stream", input: chunks(), lastModified: date }]));
		expect(new TextDecoder().decode(extracted.stream)).toBe("abcd");
	});

	test("a Response without body zips as an empty file", async () => {
		const extracted = await extractZip(await zipOf([{ name: "empty", input: new Response(null), lastModified: date }]));
		expect(extracted.empty.length).toBe(0);
	});

	test("invalid modification dates throw", async () => {
		await expect(zipOf([{ name: "a", input: "x", lastModified: "not a date" }])).rejects.toThrow("Invalid modification date.");
	});

	test("dates before 1980 are clamped to the DOS epoch", async () => {
		const zip = await zipOf([{ name: "a", input: "x", lastModified: new Date(1975, 5, 1) }]);
		const dosDate = new DataView(zip.buffer).getUint16(12, true);
		expect(dosDate).toBe((1 << 5) | 1);
	});

	test("an entry named __proto__ stays an own property", async () => {
		const extracted = await extractZip(await zipOf([{ name: "__proto__", input: "x", lastModified: date }]));
		expect(Object.keys(extracted)).toEqual(["__proto__"]);
		expect(Object.getPrototypeOf(extracted)).toBe(Object.prototype);
	});

	test("corrupt deflate data rejects instead of crashing", async () => {
		const zip = await zipOf([{ name: "a.txt", input: "\xff\xff\xff\xff corrupt", lastModified: date }]);
		const view = new DataView(zip.buffer);
		let central = zip.length - 22;
		while (view.getUint32(central) !== 0x504b0102) central--;
		view.setUint16(central + 10, 8, true);
		await expect(extractZip(zip)).rejects.toThrow("Failed to decompress a.txt");
	});

	test("more than 65535 entries round-trip through ZIP64", async () => {
		const files = Array.from({ length: 70000 }, (_, i) => ({ name: `f${i}`, input: "", lastModified: date }));
		const zip = await zipOf(files);
		expect(BigInt(zip.length)).toBe(predictLength(files.map(({ name, input }) => ({ name, input }))));
		expect(Object.keys(await extractZip(zip)).length).toBe(70000);
	});
});
