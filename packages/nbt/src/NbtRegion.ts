import type { NbtChunkResolver } from "@/NbtChunk";
import { NbtChunk } from "@/NbtChunk";
import type { JsonValue } from "@/util/Json";
import { Json } from "@/util/Json";

abstract class NbtAbstractRegion<T extends { x: number; z: number }> {
	protected static readonly REGION_SIZE = 32;
	protected static readonly CHUNK_COUNT = NbtAbstractRegion.REGION_SIZE * NbtAbstractRegion.REGION_SIZE;
	protected static readonly SECTOR_SIZE = 4096;
	protected static readonly HEADER_SIZE = 8192;

	protected readonly chunks: (T | undefined)[];

	constructor(chunks: T[]) {
		this.chunks = Array(NbtAbstractRegion.CHUNK_COUNT).fill(undefined);
		for (const chunk of chunks) {
			const index = NbtRegion.getIndex(chunk.x, chunk.z);
			this.chunks[index] = chunk;
		}
	}

	public getChunkPositions(): [number, number][] {
		return this.chunks.flatMap((c) => (c ? [[c.x, c.z]] : []));
	}

	public getChunk(index: number) {
		if (index < 0 || index >= NbtAbstractRegion.CHUNK_COUNT) {
			return undefined;
		}
		return this.chunks[index];
	}

	public findChunk(x: number, z: number) {
		return this.getChunk(NbtRegion.getIndex(x, z));
	}

	public getFirstChunk() {
		return this.chunks.filter((c) => c !== undefined)[0];
	}

	public filter(predicate: (chunk: T) => boolean) {
		return this.chunks.filter((c): c is T => c !== undefined && predicate(c));
	}

	public map<U>(mapper: (chunk: T) => U) {
		return this.chunks.flatMap((c) => (c !== undefined ? [mapper(c)] : []));
	}
}

export class NbtRegion extends NbtAbstractRegion<NbtChunk> {
	public async write(): Promise<Uint8Array> {
		// First pass: calculate total sectors needed
		let totalSectors = 0;
		for (const chunk of this.chunks) {
			if (chunk === undefined) continue;
			const chunkData = await chunk.getRaw();
			totalSectors += Math.ceil(chunkData.length / NbtAbstractRegion.SECTOR_SIZE);
		}

		const array = new Uint8Array(NbtAbstractRegion.HEADER_SIZE + totalSectors * NbtAbstractRegion.SECTOR_SIZE);
		const dataView = new DataView(array.buffer);

		let offset = 2;
		for (const chunk of this.chunks) {
			if (chunk === undefined) continue;
			const chunkData = await chunk.getRaw();
			const i = 4 * ((chunk.x & 31) + (chunk.z & 31) * 32);
			const sectors = Math.ceil(chunkData.length / NbtAbstractRegion.SECTOR_SIZE);
			dataView.setInt8(i, offset >> 16);
			dataView.setInt16(i + 1, offset & 0xffff);
			dataView.setInt8(i + 3, sectors);
			dataView.setInt32(i + NbtAbstractRegion.SECTOR_SIZE, chunk.timestamp);

			const j = offset * NbtAbstractRegion.SECTOR_SIZE;
			dataView.setInt32(j, chunkData.length + 1);
			dataView.setInt8(j + 4, chunk.compression);
			array.set(chunkData, j + 5);

			offset += sectors;
		}
		return array;
	}

	public static read(array: Uint8Array) {
		const chunks: NbtChunk[] = [];
		for (let x = 0; x < NbtAbstractRegion.REGION_SIZE; x += 1) {
			for (let z = 0; z < NbtAbstractRegion.REGION_SIZE; z += 1) {
				const i = 4 * ((x & 31) + (z & 31) * 32);
				const sectors = array[i + 3];
				if (sectors === 0) continue;

				const offset = (array[i] << 16) + (array[i + 1] << 8) + array[i + 2];
				const timestamp =
					(array[i + NbtAbstractRegion.SECTOR_SIZE] << 24) +
					(array[i + NbtAbstractRegion.SECTOR_SIZE + 1] << 16) +
					(array[i + NbtAbstractRegion.SECTOR_SIZE + 2] << 8) +
					array[i + NbtAbstractRegion.SECTOR_SIZE + 3];

				const j = offset * NbtAbstractRegion.SECTOR_SIZE;
				const length = (array[j] << 24) + (array[j + 1] << 16) + (array[j + 2] << 8) + array[j + 3];
				const compression = array[j + 4];
				const data = array.slice(j + 5, j + 4 + length);

				chunks.push(new NbtChunk(x, z, compression, timestamp, data));
			}
		}
		return new NbtRegion(chunks);
	}

	public static getIndex(x: number, z: number) {
		return (x & 31) + (z & 31) * 32;
	}

	public toJson(): JsonValue {
		return {
			chunks: this.map((c) => c.toJson())
		};
	}

	public static fromJson(value: JsonValue, chunkResolver: NbtChunkResolver): NbtRegion.Ref {
		const obj = Json.readObject(value) ?? {};
		const chunks = Json.readArray(obj.chunks) ?? [];
		const chunks2 = chunks.flatMap((c) => (c !== undefined ? [NbtChunk.fromJson(c, chunkResolver)] : []));
		return new NbtRegion.Ref(chunks2);
	}
}

export namespace NbtRegion {
	export class Ref extends NbtAbstractRegion<NbtChunk.Ref> {}
}
