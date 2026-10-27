import { deflateSync } from "node:zlib";
import { gzipSync, zlibSync } from "fflate";
import { describe, expect, it } from "vitest";
import { Compression, compress, decompress, detectCompression } from "@/index";

const data = new TextEncoder().encode("hello nbt ".repeat(64));

describe("compression", () => {
	it("should write zlib with its header and read it back", () => {
		const compressed = compress(data, Compression.Zlib);
		expect(detectCompression(compressed)).toBe(Compression.Zlib);
		expect(decompress(compressed)).toEqual(data);
	});

	it("should read zlib and gzip written by other tools", () => {
		expect(decompress(deflateSync(data))).toEqual(data);
		expect(decompress(zlibSync(data))).toEqual(data);
		expect(decompress(gzipSync(data))).toEqual(data);
	});

	it("should return plain Uint8Array copies", () => {
		const out = decompress(compress(data, Compression.Gzip));
		expect(out.constructor).toBe(Uint8Array);
		expect(out).toEqual(data);
	});
});
