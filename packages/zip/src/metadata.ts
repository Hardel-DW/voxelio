import type { BufferLike, StreamLike } from "@/input";
import { encodeString, makeUint8Array } from "@/utils";

const SLASH = 47;

export type Metadata = {
	encodedName: Uint8Array;
	uncompressedSize?: bigint;
	/** keep track of whether the filename was supplied as a Buffer-like object */
	nameIsBuffer: boolean;
};

/** The file name and size are read from File and Response inputs unless overridden.
 * For other inputs the `name` is required.
 * @param name will be coerced, so… whatever, but Uint8Array or string would be nice
 */
export function normalizeMetadata(input?: File | Response | BufferLike | StreamLike, name?: unknown, size?: number | bigint): Metadata {
	const [encodedName, nameIsBuffer] = normalizeName(name);

	if (input instanceof File) {
		return { encodedName: fixFilename(encodedName ?? encodeString(input.name)), uncompressedSize: BigInt(input.size), nameIsBuffer };
	}

	if (input instanceof Response) {
		const contentDisposition = input.headers.get("content-disposition");
		const filename = contentDisposition?.match(/;\s*filename\*?\s*=\s*(?:UTF-\d+''|)["']?([^;"'\r\n]*)["']?(?:;|$)/i);
		const urlName = filename?.[1] || (input.url && new URL(input.url).pathname.split("/").reverse().find(Boolean));
		const decoded = urlName && decodeURIComponent(urlName);
		const length = size || Number(input.headers.get("content-length"));
		return { encodedName: fixFilename(encodedName ?? encodeString(decoded)), uncompressedSize: BigInt(length), nameIsBuffer };
	}

	const isFile = input !== undefined || size !== undefined;
	return { encodedName: fixFilename(encodedName, isFile), uncompressedSize: inputSize(input, size), nameIsBuffer };
}

function inputSize(input: BufferLike | StreamLike | undefined, size: number | bigint | undefined): bigint | undefined {
	if (typeof input === "string") return BigInt(encodeString(input).length);
	if (input instanceof Blob) return BigInt(input.size);
	if (input instanceof ArrayBuffer || ArrayBuffer.isView(input)) return BigInt(input.byteLength);
	if (size !== undefined && size >= 0) return BigInt(size);
	return input === undefined ? 0n : undefined;
}

function normalizeName(name: unknown): [encodedName: Uint8Array | undefined, nameIsBuffer: boolean] {
	if (!name) return [undefined, false];
	if (name instanceof Uint8Array) return [name, true];
	if (ArrayBuffer.isView(name) || name instanceof ArrayBuffer) return [makeUint8Array(name), true];
	return [encodeString(name), false];
}

/** Strips trailing slashes from files, adds one to folders. */
function fixFilename(name: Uint8Array | undefined, isFile = true): Uint8Array {
	if (!name || name.every((c) => c === SLASH)) throw new Error("The file must have a name.");
	if (isFile) {
		let end = name.length;
		while (name[end - 1] === SLASH) end--;
		return end === name.length ? name : name.subarray(0, end);
	}

	if (name[name.length - 1] === SLASH) return name;
	const folder = new Uint8Array(name.length + 1);
	folder.set(name);
	folder[name.length] = SLASH;
	return folder;
}
