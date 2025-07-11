import "@/polyfills";
import { type BufferLike, normalizeInput, ReadableFromIterator, type StreamLike } from "@/input";
import { normalizeMetadata } from "@/metadata";
import { extractZip } from "@/unzip";
import { contentLength, type ForAwaitable, loadFiles } from "@/zip";

/** The file name, modification date and size will be read from the input;
 * extra arguments can be given to override the input's metadata. */
export type InputWithMeta =
	| File
	| Response
	| {
		input: File | Response;
		name?: unknown;
		lastModified?: unknown;
		size?: number | bigint;
		mode?: number;
	};

/** Intrinsic size, but the file name must be provided and modification date can't be guessed. */
type InputWithSizeMeta = {
	input: BufferLike;
	name: unknown;
	lastModified?: unknown;
	size?: number | bigint;
	mode?: number;
};

/** The file name must be provided ; modification date and content length can't be guessed. */
export type InputWithoutMeta = {
	input: StreamLike;
	name: unknown;
	lastModified?: unknown;
	size?: number | bigint;
	mode?: number;
};

/** The folder name must be provided ; modification date can't be guessed. */
type InputFolder = {
	name: unknown;
	lastModified?: unknown;
	input?: never;
	size?: never;
	mode?: number;
};

/** Both filename and size must be provided ; input is not helpful here. */
type JustMeta = {
	input?: StreamLike | undefined;
	name: unknown;
	lastModified?: unknown;
	size: number | bigint;
	mode?: number;
};

export type Options = {
	/** If provided, the returned Response will have its `Content-Length` header set to this value.
	 * It can be computed accurately with the `predictLength` function. */
	length?: number | bigint;
	/** If provided, the returned Response will have its `Content-Length` header set to the result of
	 * calling `predictLength` on that metadata. Overrides the `length` option. */
	metadata?: Iterable<InputWithMeta | InputWithSizeMeta | JustMeta>;
	/** The ZIP *language encoding flag* will always be set when a filename was given as a string,
	 * but when it is given as an ArrayView or ArrayBuffer, it depends on this option :
	 * - `true`: always on (ArrayBuffers will *always* be flagged as UTF-8) — recommended,
	 * - `false`: always off (ArrayBuffers will *never* be flagged as UTF-8),
	 * - `undefined`: each ArrayBuffer will be tested and flagged if it is valid UTF-8. */
	buffersAreUTF8?: boolean;
};

function normalizeArgs(file: InputWithMeta | InputWithSizeMeta | InputWithoutMeta | InputFolder | JustMeta) {
	return file instanceof File || file instanceof Response
		? ([[file], [file]] as const)
		: ([
			[file.input, file.name, file.size],
			[file.input, file.lastModified, file.mode]
		] as const);
}

function* mapMeta(files: Iterable<InputWithMeta | InputWithSizeMeta | JustMeta | InputFolder>) {
	for (const file of files) {
		// @ts-ignore type inference isn't good enough for this… yet…
		// but rewriting the code to be more explicit would make it longer
		yield normalizeMetadata(...normalizeArgs(file)[0]);
	}
}

function mapFiles(files: ForAwaitable<InputWithMeta | InputWithSizeMeta | InputWithoutMeta | InputFolder>) {
	// @ts-ignore TypeScript really needs to catch up
	const iterator = files[Symbol.iterator in files ? Symbol.iterator : Symbol.asyncIterator]();
	return {
		async next() {
			const res = await iterator.next();
			if (res.done) return res;
			const [metaArgs, dataArgs] = normalizeArgs(res.value);

			const inputArg = dataArgs[0];
			const modDateArg = dataArgs[1];
			const modeArg = dataArgs[2];

			const normalizedData =
				inputArg === undefined ? normalizeInput(undefined, modDateArg, modeArg) : normalizeInput(inputArg, modDateArg, modeArg);

			return {
				done: false,
				value: Object.assign(
					normalizedData,
					normalizeMetadata(
						metaArgs[0] as File | Response | BufferLike | StreamLike | undefined,
						metaArgs[1],
						metaArgs[2] as number | bigint | undefined
					)
				)
			};
		},
		throw: iterator.throw?.bind(iterator),
		[Symbol.asyncIterator]() {
			return this;
		}
	};
}

/** Given an iterable of file metadata (or equivalent),
 * @returns the exact byte length of the Zip file that would be generated by `downloadZip`. */
export const predictLength = (files: Iterable<InputWithMeta | InputWithSizeMeta | JustMeta | InputFolder>) => contentLength(mapMeta(files));

export function downloadZip(
	files: ForAwaitable<InputWithMeta | InputWithSizeMeta | InputWithoutMeta | InputFolder>,
	options: Options = {}
) {
	const headers: Record<string, string> = {
		"Content-Type": "application/zip",
		"Content-Disposition": "attachment"
	};
	if (typeof options.length === "bigint" && options.length > 0n) {
		headers["Content-Length"] = String(options.length);
	} else if (typeof options.length === "number" && Number.isInteger(options.length) && options.length > 0) {
		headers["Content-Length"] = String(options.length);
	}
	if (options.metadata) {
		headers["Content-Length"] = String(predictLength(options.metadata));
	}
	return new Response(makeZip(files, options), { headers });
}

export function makeZip(files: ForAwaitable<InputWithMeta | InputWithSizeMeta | InputWithoutMeta | InputFolder>, options: Options = {}) {
	const mapped = mapFiles(files);
	return ReadableFromIterator(loadFiles(mapped, options), mapped);
}

/**
 * Extracts files from a ZIP using a Uint8Array.
 * @param data The ZIP file content as a Uint8Array
 * @returns An object containing file paths and their contents
 */
export { extractZip };
