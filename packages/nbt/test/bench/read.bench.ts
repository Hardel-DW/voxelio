import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bench, describe } from "vitest";
import { compress, decompress } from "@/compression";
import { NbtFile } from "@/file";
import { LazyNbtFile } from "@/lazy";
import { Compression } from "@/types";

const dir = path.dirname(fileURLToPath(import.meta.url));
const cubeCompressed = new Uint8Array(readFileSync(path.join(dir, "../mock/cube.nbt")));
const taigaCompressed = new Uint8Array(readFileSync(path.join(dir, "../mock/taiga_armorer_2.nbt")));
const cubeData = decompress(cubeCompressed);
const taigaData = decompress(taigaCompressed);

describe("NBT Read - Full Parse (no compression)", () => {
	bench("cube.nbt - full parse", () => {
		NbtFile.read(cubeData);
	});

	bench("taiga_armorer_2.nbt - full parse", () => {
		NbtFile.read(taigaData);
	});
});

describe("NBT Read - Selective Parse (no compression)", () => {
	bench("cube.nbt - selective [DataVersion]", () => {
		NbtFile.readSelective(cubeData, ["DataVersion"]);
	});

	bench("cube.nbt - selective [DataVersion, size]", () => {
		NbtFile.readSelective(cubeData, ["DataVersion", "size"]);
	});

	bench("cube.nbt - selective [palette]", () => {
		NbtFile.readSelective(cubeData, ["palette"]);
	});
});

describe("NBT Read - Lazy Loading (no compression)", () => {
	bench("cube.nbt - lazy init + keys()", () => {
		const lazy = new LazyNbtFile(cubeData);
		lazy.keys();
	});

	bench("cube.nbt - lazy get single field", () => {
		const lazy = new LazyNbtFile(cubeData);
		lazy.get("DataVersion");
	});

	bench("cube.nbt - lazy get multiple fields", () => {
		const lazy = new LazyNbtFile(cubeData);
		lazy.getMany(["DataVersion", "size", "palette"]);
	});
});

describe("NBT Read - With Compression (pako included)", () => {
	bench("cube.nbt - full parse with gzip", () => {
		NbtFile.read(cubeCompressed);
	});

	bench("taiga_armorer_2.nbt - full parse with gzip", () => {
		NbtFile.read(taigaCompressed);
	});
});

describe("fflate Only", () => {
	bench("cube.nbt - full parse with gzip", () => {
		compress(cubeData, Compression.Gzip);
	});

	bench("taiga_armorer_2.nbt - full parse with gzip", () => {
		compress(taigaData, Compression.Gzip);
	});
});
