import { describe, expect, it, beforeAll } from "vitest";
import { NbtChunk } from "@/NbtChunk";
import { NbtFile } from "@/NbtFile";
import { NbtRegion } from "@/NbtRegion";
import { NbtShort } from "@/tags/NbtShort";
import { NbtString } from "@/tags/NbtString";

// Utility functions for compression (same as in NbtFile.ts)
async function compressData(data: Uint8Array, format: "gzip" | "deflate"): Promise<Uint8Array> {
	const cs = new CompressionStream(format);
	const stream = new ReadableStream({
		start(controller) {
			controller.enqueue(data);
			controller.close();
		}
	});

	const compressed = await new Response(stream.pipeThrough(cs)).arrayBuffer();
	return new Uint8Array(compressed);
}

const raw = new Uint8Array([10, 0, 0, 1, 0, 3, 102, 111, 111, 4, 0]);
let rawCompressed: Uint8Array;
let rawZCompressed: Uint8Array;
let rawRegion: Uint8Array;

describe("NbtRegion", () => {
	beforeAll(async () => {
		rawCompressed = await compressData(raw, "gzip");
		rawZCompressed = await compressData(raw, "deflate");

		rawRegion = new Uint8Array(Array(4096 * 6).fill(0));
		rawRegion.set([0, 0, 2, 1, 0, 0, 3, 1, 0, 0, 4, 1, 0, 0, 5, 1]); // sectors
		rawRegion.set([0, 0, 0, 4, 0, 0, 1, 144], 4096); // timestamps
		rawRegion.set([0, 0, 0, rawCompressed.length + 1, 1, ...rawCompressed], 4096 * 2);
		rawRegion.set([0, 0, 0, rawZCompressed.length + 1, 2, ...rawZCompressed], 4096 * 3);
		rawRegion.set([0, 0, 0, raw.length + 1, 3, ...raw], 4096 * 4);
		rawRegion.set([0, 0, 0, 2, 14, 0], 4096 * 5); // invalid compression
	});

	it("read", () => {
		const region = NbtRegion.read(rawRegion);
		expect(region.getChunkPositions()).toStrictEqual([
			[0, 0],
			[1, 0],
			[2, 0],
			[3, 0]
		]);
		expect(region.findChunk(1, 0)?.getCompression()).toEqual("zlib");
		expect(region.findChunk(0, 0)?.timestamp).toEqual(4);
		expect(region.findChunk(1, 0)?.timestamp).toEqual(400);
	});

	it("full", async () => {
		const file = NbtFile.create({ compression: "zlib" });
		file.root.set("hello", new NbtShort(3));
		file.root.set("world", new NbtString("!"));
		const chunk = await NbtChunk.create(2, 5, file);
		const region = new NbtRegion([chunk]);
		const bytes = await region.write();
		const region2 = NbtRegion.read(bytes);
		expect(region).toStrictEqual(region2);
		const foundChunk = region2.findChunk(2, 5);
		expect(foundChunk).toBeDefined();
		if (foundChunk) {
			expect(await foundChunk.getFile()).toStrictEqual(file);
		}
	});
});
