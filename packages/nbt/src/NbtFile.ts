import type { DataInput } from "@/io/DataInput";
import { RawDataInput } from "@/io/DataInput";
import type { DataOutput } from "@/io/DataOutput";
import { RawDataOutput } from "@/io/DataOutput";
import { NbtCompound } from "@/tags/NbtCompound";
import { NbtType } from "@/tags/NbtType";
import { getBedrockHeader, hasGzipHeader, hasZlibHeader } from "@/Util";
import type { JsonValue } from "@/util/Json";
import { Json } from "@/util/Json";

export type NbtCompressionMode = "gzip" | "zlib" | "none";

export interface NbtCreateOptions {
	name?: string;
	compression?: NbtCompressionMode;
	littleEndian?: boolean;
	bedrockHeader?: number | boolean;
}

// Utility functions for compression
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

async function decompressData(data: Uint8Array, format: "gzip" | "deflate"): Promise<Uint8Array> {
	const ds = new DecompressionStream(format);
	const stream = new ReadableStream({
		start(controller) {
			controller.enqueue(data);
			controller.close();
		}
	});

	const decompressed = await new Response(stream.pipeThrough(ds)).arrayBuffer();
	return new Uint8Array(decompressed);
}

export class NbtFile {
	private static readonly DEFAULT_NAME = "";
	private static readonly DEFAULT_BEDROCK_HEADER = 4;

	constructor(
		public name: string,
		public root: NbtCompound,
		public compression: NbtCompressionMode,
		public readonly littleEndian: boolean,
		public readonly bedrockHeader: number | undefined
	) {}

	private writeNamedTag(output: DataOutput) {
		output.writeByte(NbtType.Compound);
		output.writeString(this.name);
		this.root.toBytes(output);
	}

	public async write(): Promise<Uint8Array> {
		const littleEndian = this.littleEndian === true || this.bedrockHeader !== undefined;
		const output = new RawDataOutput({ littleEndian, offset: this.bedrockHeader && 8 });
		this.writeNamedTag(output);

		if (this.bedrockHeader !== undefined) {
			const end = output.offset;
			output.offset = 0;
			output.writeInt(this.bedrockHeader);
			output.writeInt(end - 8);
			output.offset = end;
		}
		const array = output.getData();

		if (this.compression === "gzip") {
			return await compressData(array, "gzip");
		} else if (this.compression === "zlib") {
			return await compressData(array, "deflate");
		}
		return array;
	}

	private static readNamedTag(input: DataInput) {
		if (input.readByte() !== NbtType.Compound) {
			throw new Error("Top tag should be a compound");
		}
		return {
			name: input.readString(),
			root: NbtCompound.fromBytes(input)
		};
	}

	public static create(options: NbtCreateOptions = {}) {
		const name = options.name ?? NbtFile.DEFAULT_NAME;
		const root = NbtCompound.create();
		const compression = options.compression ?? "none";
		const bedrockHeader = typeof options.bedrockHeader === "boolean" ? NbtFile.DEFAULT_BEDROCK_HEADER : options.bedrockHeader;
		const littleEndian = options.littleEndian ?? options.bedrockHeader !== undefined;

		return new NbtFile(name, root, compression, littleEndian, bedrockHeader);
	}

	public static async read(array: Uint8Array, options: NbtCreateOptions = {}): Promise<NbtFile> {
		const bedrockHeader =
			typeof options.bedrockHeader === "number" ? options.bedrockHeader : options.bedrockHeader ? getBedrockHeader(array) : undefined;
		const isGzipCompressed =
			options.compression === "gzip" || (!bedrockHeader && options.compression === undefined && hasGzipHeader(array));
		const isZlibCompressed =
			options.compression === "zlib" || (!bedrockHeader && options.compression === undefined && hasZlibHeader(array));

		const uncompressedData =
			isZlibCompressed || isGzipCompressed ? await decompressData(array, isGzipCompressed ? "gzip" : "deflate") : array;
		const littleEndian = options.littleEndian || bedrockHeader !== undefined;
		const compression = isGzipCompressed ? "gzip" : isZlibCompressed ? "zlib" : "none";

		const input = new RawDataInput(uncompressedData, { littleEndian, offset: bedrockHeader && 8 });
		const { name, root } = NbtFile.readNamedTag(input);

		return new NbtFile(options.name ?? name, root, compression, littleEndian, bedrockHeader);
	}

	public toJson(): JsonValue {
		return {
			name: this.name,
			root: this.root.toJson(),
			compression: this.compression,
			littleEndian: this.littleEndian,
			bedrockHeader: this.bedrockHeader ?? null
		};
	}

	public static fromJson(value: JsonValue): NbtFile {
		const obj = Json.readObject(value) ?? {};
		const name = Json.readString(obj.name) ?? "";
		const root = NbtCompound.fromJson(obj.root ?? {});
		const compression = (Json.readString(obj.compression) ?? "none") as NbtCompressionMode;
		const littleEndian = Json.readBoolean(obj.littleEndian) ?? false;
		const bedrockHeader = Json.readNumber(obj.bedrockHeader);
		return new NbtFile(name, root, compression, littleEndian, bedrockHeader);
	}
}
