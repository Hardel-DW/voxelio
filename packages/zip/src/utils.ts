export const makeBuffer = (size: number): DataView => new DataView(new ArrayBuffer(size));
export const makeUint8Array = (thing: ArrayBuffer | ArrayBufferView): Uint8Array =>
	new Uint8Array(thing instanceof ArrayBuffer ? thing : thing.buffer);
export const encodeString = (whatever: unknown): Uint8Array => new TextEncoder().encode(String(whatever));
export const clampInt32 = (n: bigint): number => Math.min(0xffffffff, Number(n));
export const clampInt16 = (n: bigint): number => Math.min(0xffff, Number(n));
