import type * as NodeZlib from "node:zlib";
import { gunzipSync, gzipSync, unzlibSync, zlibSync } from "fflate";
import { NbtError, NbtErrorKind } from "@/error";
import { Compression } from "@/types";

/**
 * Detect compression format from magic bytes.
 * - Gzip: 0x1f 0x8b
 * - Zlib: 0x78 (followed by compression level indicator)
 */
export function detectCompression(data: Uint8Array): Compression {
	if (data.length < 2) {
		return Compression.None;
	}

	// Gzip magic: 0x1f 0x8b
	if (data[0] === 0x1f && data[1] === 0x8b) {
		return Compression.Gzip;
	}

	// Zlib magic: 0x78 followed by compression level
	// 0x78 0x01 = no compression
	// 0x78 0x5e = fast compression
	// 0x78 0x9c = default compression
	// 0x78 0xda = best compression
	if (data[0] === 0x78 && (data[1] === 0x01 || data[1] === 0x5e || data[1] === 0x9c || data[1] === 0xda)) {
		return Compression.Zlib;
	}

	return Compression.None;
}

/** Compression level 0-9 (0=none, 1=fastest, 9=best). Default: 6 */
export interface CompressOptions {
	level?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
}

type Level = NonNullable<CompressOptions["level"]>;

interface Codec {
	gunzip(data: Uint8Array): Uint8Array;
	unzlib(data: Uint8Array): Uint8Array;
	gzip(data: Uint8Array, level: Level): Uint8Array;
	zlib(data: Uint8Array, level: Level): Uint8Array;
}

const FFLATE: Codec = {
	gunzip: (data) => gunzipSync(data),
	unzlib: (data) => unzlibSync(data),
	gzip: (data, level) => gzipSync(data, { level }),
	zlib: (data, level) => zlibSync(data, { level })
};

// Plain views: a Buffer would make slice() share memory instead of copying.
const view = (buffer: Uint8Array): Uint8Array => new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);

const nodeCodec = (zlib: typeof NodeZlib): Codec => ({
	gunzip: (data) => view(zlib.gunzipSync(data)),
	unzlib: (data) => view(zlib.inflateSync(data)),
	gzip: (data, level) => view(zlib.gzipSync(data, { level })),
	zlib: (data, level) => view(zlib.deflateSync(data, { level }))
});

// Native zlib on Node is several times faster than fflate; browsers keep fflate.
const codec: Codec = typeof process !== "undefined" && process.getBuiltinModule ? nodeCodec(process.getBuiltinModule("node:zlib")) : FFLATE;

/**
 * Decompress data based on format.
 * Auto-detects if format not specified.
 */
export function decompress(data: Uint8Array, format?: Compression): Uint8Array {
	const compression = format ?? detectCompression(data);
	if (compression === Compression.None) {
		return data;
	}

	try {
		return compression === Compression.Gzip ? codec.gunzip(data) : codec.unzlib(data);
	} catch (e) {
		const message = e instanceof Error ? e.message : "Unknown compression error";
		throw new NbtError(`Decompression failed: ${message}`, NbtErrorKind.CompressionError);
	}
}

/**
 * Compress data with specified format.
 * @param level - Compression level 0-9 (0=none, 1=fastest, 9=best). Default: 6
 */
export function compress(data: Uint8Array, format: Compression, options: CompressOptions = {}): Uint8Array {
	if (format === Compression.None) {
		return data;
	}

	const level = options.level ?? 6;
	try {
		return format === Compression.Gzip ? codec.gzip(data, level) : codec.zlib(data, level);
	} catch (e) {
		const message = e instanceof Error ? e.message : "Unknown compression error";
		throw new NbtError(`Compression failed: ${message}`, NbtErrorKind.CompressionError);
	}
}
