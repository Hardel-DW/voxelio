export const NbtErrorKind = {
	UnexpectedEof: "UnexpectedEof",
	InvalidData: "InvalidData",
	InvalidTagType: "InvalidTagType",
	CompressionError: "CompressionError"
} as const;

export type NbtErrorKind = (typeof NbtErrorKind)[keyof typeof NbtErrorKind];

export class NbtError extends Error {
	readonly kind: NbtErrorKind;

	constructor(message: string, kind: NbtErrorKind) {
		super(message);
		this.name = "NbtError";
		this.kind = kind;
	}
}
