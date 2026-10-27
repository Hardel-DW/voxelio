import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "vitest";
import { compress, decompress } from "@/compression";
import { NbtFile } from "@/file";
import { LazyNbtFile } from "@/lazy";
import { Compression } from "@/types";

const dir = path.dirname(fileURLToPath(import.meta.url));
const cubeCompressed = new Uint8Array(readFileSync(path.join(dir, "../mock/cube.nbt")));
const taigaCompressed = new Uint8Array(readFileSync(path.join(dir, "../mock/taiga_armorer_2.nbt")));
const cubeData = decompress(cubeCompressed);
const taigaData = decompress(taigaCompressed);

test("NBT Read - Full Parse (no compression)", async ({ bench }) => {
	await bench("cube.nbt - full parse", () => {
		NbtFile.read(cubeData);
	}).run();

	await bench("taiga_armorer_2.nbt - full parse", () => {
		NbtFile.read(taigaData);
	}).run();
});

test("NBT Read - Selective Parse (no compression)", async ({ bench }) => {
	await bench("cube.nbt - selective [DataVersion]", () => {
		NbtFile.readSelective(cubeData, ["DataVersion"]);
	}).run();

	await bench("cube.nbt - selective [DataVersion, size]", () => {
		NbtFile.readSelective(cubeData, ["DataVersion", "size"]);
	}).run();

	await bench("cube.nbt - selective [palette]", () => {
		NbtFile.readSelective(cubeData, ["palette"]);
	}).run();
});

test("NBT Read - Lazy Loading (no compression)", async ({ bench }) => {
	await bench("cube.nbt - lazy init + keys()", () => {
		const lazy = new LazyNbtFile(cubeData);
		lazy.keys();
	}).run();

	await bench("cube.nbt - lazy get single field", () => {
		const lazy = new LazyNbtFile(cubeData);
		lazy.get("DataVersion");
	}).run();

	await bench("cube.nbt - lazy get multiple fields", () => {
		const lazy = new LazyNbtFile(cubeData);
		lazy.getMany(["DataVersion", "size", "palette"]);
	}).run();
});

test("NBT Read - With Compression (fflate)", async ({ bench }) => {
	await bench("cube.nbt - full parse with gzip", () => {
		NbtFile.read(cubeCompressed);
	}).run();

	await bench("taiga_armorer_2.nbt - full parse with gzip", () => {
		NbtFile.read(taigaCompressed);
	}).run();
});

test("fflate Only", async ({ bench }) => {
	await bench("cube.nbt - full parse with gzip", () => {
		compress(cubeData, Compression.Gzip);
	}).run();

	await bench("taiga_armorer_2.nbt - full parse with gzip", () => {
		compress(taigaData, Compression.Gzip);
	}).run();
});
