import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bench, describe } from "vitest";
import { decompress } from "@/compression";
import { NbtFile } from "@/file";
import { Compression } from "@/types";

const dir = path.dirname(fileURLToPath(import.meta.url));

const cubeCompressed = new Uint8Array(readFileSync(path.join(dir, "../mock/cube.nbt")));
const taigaCompressed = new Uint8Array(readFileSync(path.join(dir, "../mock/taiga_armorer_2.nbt")));
const cubeData = decompress(cubeCompressed);
const taigaData = decompress(taigaCompressed);
const cubeFile = NbtFile.read(cubeData);
const taigaFile = NbtFile.read(taigaData);

describe("NBT Write - No Compression", () => {
	bench("cube.nbt - write uncompressed", () => {
		cubeFile.write({ compression: Compression.None });
	});

	bench("taiga_armorer_2.nbt - write uncompressed", () => {
		taigaFile.write({ compression: Compression.None });
	});
});

describe("NBT Write - With Compression (pako included)", () => {
	bench("cube.nbt - write gzip", () => {
		cubeFile.write({ compression: Compression.Gzip });
	});

	bench("cube.nbt - write zlib", () => {
		cubeFile.write({ compression: Compression.Zlib });
	});

	bench("taiga_armorer_2.nbt - write gzip", () => {
		taigaFile.write({ compression: Compression.Gzip });
	});
});

describe("NBT Round-trip - No Compression", () => {
	bench("cube.nbt - read + write", () => {
		const file = NbtFile.read(cubeData);
		file.write({ compression: Compression.None });
	});

	bench("taiga_armorer_2.nbt - read + write", () => {
		const file = NbtFile.read(taigaData);
		file.write({ compression: Compression.None });
	});
});
