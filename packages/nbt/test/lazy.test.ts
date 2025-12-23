import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { decompress } from "@/compression";
import { isCompound, isList } from "@/guards";
import { LazyNbtFile } from "@/lazy";
import { NbtType } from "@/types";

const dir = path.dirname(fileURLToPath(import.meta.url));
const cubeData = readFileSync(path.join(dir, "mock/cube.nbt"));
const cubeDecompressed = decompress(new Uint8Array(cubeData));

describe("LazyNbtFile", () => {
	it("should create without parsing", () => {
		const lazy = new LazyNbtFile(cubeDecompressed);
		expect(lazy).toBeDefined();
	});

	it("should list all keys without parsing values", () => {
		const lazy = new LazyNbtFile(cubeDecompressed);
		const keys = lazy.keys();
		expect(keys.length).toBeGreaterThan(0);
		expect(keys).toContain("DataVersion");
	});

	it("should check field existence without parsing", () => {
		const lazy = new LazyNbtFile(cubeDecompressed);
		expect(lazy.has("DataVersion")).toBe(true);
		expect(lazy.has("NonExistent")).toBe(false);
	});

	it("should parse only requested field", () => {
		const lazy = new LazyNbtFile(cubeDecompressed);
		const dataVersion = lazy.get("DataVersion");
		expect(dataVersion).toBeDefined();
		expect(dataVersion?.type).toBe(NbtType.Int);
	});

	it("should cache parsed fields", () => {
		const lazy = new LazyNbtFile(cubeDecompressed);
		const first = lazy.get("DataVersion");
		const second = lazy.get("DataVersion");
		expect(first).toBe(second);
	});

	it("should get multiple fields at once", () => {
		const lazy = new LazyNbtFile(cubeDecompressed);
		const fields = lazy.getMany(["DataVersion", "size"]);
		expect(fields.size).toBe(2);
		expect(fields.has("DataVersion")).toBe(true);
		expect(fields.has("size")).toBe(true);
	});

	it("should convert to full compound", () => {
		const lazy = new LazyNbtFile(cubeDecompressed);
		const compound = lazy.toCompound();
		expect(isCompound(compound)).toBe(true);
		expect(compound.entries.size).toBeGreaterThan(0);
	});

	it("should clear cache", () => {
		const lazy = new LazyNbtFile(cubeDecompressed);
		lazy.get("DataVersion");
		lazy.clearCache();
		const dataVersion = lazy.get("DataVersion");
		expect(dataVersion).toBeDefined();
	});

	it("should get palette list", () => {
		const lazy = new LazyNbtFile(cubeDecompressed);
		const palette = lazy.get("palette");
		expect(palette).toBeDefined();
		if (palette) {
			expect(isList(palette)).toBe(true);
		}
	});
});
