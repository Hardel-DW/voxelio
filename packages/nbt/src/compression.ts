import { deflateSync, gunzipSync, gzipSync, inflateSync } from "fflate";
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
		if (compression === Compression.Gzip) {
			return gunzipSync(data);
		}

		return inflateSync(data);
	} catch (e) {
		const message = e instanceof Error ? e.message : "Unknown compression error";
		throw new NbtError(`Decompression failed: ${message}`, NbtErrorKind.CompressionError);
	}
}

export interface CompressOptions {
	/** Compression level 0-9 (0=none, 1=fastest, 9=best). Default: 6 */
	level?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
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
		if (format === Compression.Gzip) {
			return gzipSync(data, { level });
		}

		return deflateSync(data, { level });
	} catch (e) {
		const message = e instanceof Error ? e.message : "Unknown compression error";
		throw new NbtError(`Compression failed: ${message}`, NbtErrorKind.CompressionError);
	}
}
