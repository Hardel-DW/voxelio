import { encodeString, makeUint8Array } from "@/utils";

export type BufferLike = ArrayBuffer | string | ArrayBufferView | Blob;
export type StreamLike = ReadableStream<Uint8Array> | AsyncIterable<BufferLike>;
export type ZipFileDescription = {
	modDate: Date;
	bytes: ReadableStream<Uint8Array> | Uint8Array;
	crc?: number; // computed while streaming
	mode: number; // UNIX permissions, 0o664 by default
	isFile: true;
};
export type ZipFolderDescription = {
	modDate: Date;
	mode: number; // UNIX permissions, 0o775 by default
	isFile: false;
};
export type ZipEntryDescription = ZipFileDescription | ZipFolderDescription;

/** The modification date is read from File and Response inputs unless `modDate` overrides it; it defaults to *now*.
 * A missing input describes a folder.
 * @param modDate should be a Date or timestamp or anything else that works in `new Date()`
 */
export function normalizeInput(
	input: File | Response | BufferLike | StreamLike | undefined,
	modDate?: unknown,
	mode?: number
): ZipEntryDescription {
	const date = normalizeDate(input, modDate);
	if (input === undefined) return { isFile: false, modDate: date, mode: mode || 0o775 };
	return { isFile: true, modDate: date, bytes: normalizeBytes(input), mode: mode || 0o664 };
}

function normalizeDate(input: File | Response | BufferLike | StreamLike | undefined, modDate: unknown): Date {
	if (modDate === undefined) {
		if (input instanceof File) return new Date(input.lastModified);
		const header = input instanceof Response ? input.headers.get("Last-Modified") : null;
		const date = header ? new Date(header) : new Date();
		return Number.isNaN(date.getTime()) ? new Date() : date;
	}

	const date = modDate instanceof Date ? modDate : new Date(modDate as string | number);
	if (Number.isNaN(date.getTime())) throw new Error("Invalid modification date.");
	return date;
}

function normalizeBytes(input: File | Response | BufferLike | StreamLike): ReadableStream<Uint8Array> | Uint8Array {
	if (input instanceof Blob) return input.stream();
	if (input instanceof Response) return input.body ?? new Uint8Array(0);
	if (typeof input === "string") return encodeString(input);
	if (input instanceof Uint8Array || input instanceof ReadableStream) return input;
	if (input instanceof ArrayBuffer || ArrayBuffer.isView(input)) return makeUint8Array(input);
	if (Symbol.asyncIterator in input) return ReadableFromIterator(input[Symbol.asyncIterator]());
	throw new TypeError("Unsupported input format.");
}

/** Pulls one chunk per read; cancelling the stream calls `iter.throw` unless `onCancel` is given. */
export function ReadableFromIterator(
	iter: AsyncIterator<BufferLike>,
	onCancel: (reason: unknown) => void = (reason) => iter.throw?.(reason)
): ReadableStream<Uint8Array> {
	return new ReadableStream<Uint8Array>({
		async pull(controller) {
			const next = await iter.next();
			if (next.done) return controller.close();
			controller.enqueue(next.value instanceof Blob ? new Uint8Array(await next.value.arrayBuffer()) : normalizeChunk(next.value));
		},
		cancel(reason) {
			onCancel(reason);
		}
	});
}

function normalizeChunk(chunk: Exclude<BufferLike, Blob>): Uint8Array {
	if (typeof chunk === "string") return encodeString(chunk);
	if (chunk instanceof Uint8Array) return chunk;
	return makeUint8Array(chunk);
}
