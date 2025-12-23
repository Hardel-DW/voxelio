import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { decompress } from "@/compression";
import { isCompound, isList, isString } from "@/guards";
import { NbtFile } from "@/file";
import { NbtType } from "@/types";

const dir = path.dirname(fileURLToPath(import.meta.url));
const cubeData = readFileSync(path.join(dir, "mock/cube.nbt"));
const taigaData = readFileSync(path.join(dir, "mock/taiga_armorer_2.nbt"));
const cubeDecompressed = decompress(new Uint8Array(cubeData));
const taigaDecompressed = decompress(new Uint8Array(taigaData));

describe("NbtFile.read", () => {
	it("should read cube.nbt with compression auto-detection", () => {
		const file = NbtFile.read(new Uint8Array(cubeData));
		expect(file.root.type).toBe(NbtType.Compound);
		expect(file.root.entries.size).toBeGreaterThan(0);
	});

	it("should read taiga_armorer_2.nbt", () => {
		const file = NbtFile.read(new Uint8Array(taigaData));
		expect(file.root.type).toBe(NbtType.Compound);
	});

	it("should read pre-decompressed data", () => {
		const file = NbtFile.read(cubeDecompressed);
		expect(file.root.entries.size).toBeGreaterThan(0);
	});

	it("should have DataVersion field", () => {
		const file = NbtFile.read(cubeDecompressed);
		expect(file.has("DataVersion")).toBe(true);
		expect(file.getNumber("DataVersion")).toBeGreaterThan(0);
	});

	it("should access palette as compound", () => {
		const file = NbtFile.read(cubeDecompressed);
		const palette = file.getList("palette");
		expect(palette).toBeDefined();
		if (palette) {
			expect(isList(palette)).toBe(true);
		}
	});
});

describe("NbtFile.readSelective", () => {
	it("should only parse requested fields", () => {
		const file = NbtFile.readSelective(cubeDecompressed, ["DataVersion"]);
		expect(file.has("DataVersion")).toBe(true);
		expect(file.root.entries.size).toBe(1);
	});

	it("should parse multiple fields", () => {
		const file = NbtFile.readSelective(cubeDecompressed, ["DataVersion", "size"]);
		expect(file.root.entries.size).toBe(2);
		expect(file.has("DataVersion")).toBe(true);
		expect(file.has("size")).toBe(true);
	});

	it("should handle non-existent fields gracefully", () => {
		const file = NbtFile.readSelective(cubeDecompressed, ["NonExistent"]);
		expect(file.root.entries.size).toBe(0);
	});
});

describe("NbtFile.write", () => {
	it("should write and read back the same data", () => {
		const original = NbtFile.read(cubeDecompressed);
		const written = original.write();
		const readBack = NbtFile.read(written);

		expect(readBack.root.entries.size).toBe(original.root.entries.size);
		expect(readBack.getNumber("DataVersion")).toBe(original.getNumber("DataVersion"));
	});

	it("should write with gzip compression", () => {
		const file = NbtFile.read(cubeDecompressed);
		const compressed = file.write({ compression: 1 }); // Gzip
		expect(compressed[0]).toBe(0x1f);
		expect(compressed[1]).toBe(0x8b);

		const uncompressed = file.write({ compression: 0 });
		expect(compressed.length).toBeLessThan(uncompressed.length);
	});
});

describe("Type guards", () => {
	it("should correctly identify compound tags", () => {
		const file = NbtFile.read(cubeDecompressed);
		expect(isCompound(file.root)).toBe(true);
	});

	it("should correctly identify list tags", () => {
		const file = NbtFile.read(cubeDecompressed);
		const palette = file.get("palette");
		expect(palette).toBeDefined();
		if (palette) {
			expect(isList(palette)).toBe(true);
		}
	});

	it("should correctly identify string tags", () => {
		const file = NbtFile.read(taigaDecompressed);
		const palette = file.getList("palette");
		if (palette && palette.items.length > 0) {
			const firstItem = palette.items[0];
			if (isCompound(firstItem)) {
				const name = firstItem.entries.get("Name");
				if (name) {
					expect(isString(name)).toBe(true);
				}
			}
		}
	});
});
