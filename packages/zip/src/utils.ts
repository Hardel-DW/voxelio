const encoder = new TextEncoder();

export const makeBuffer = (size: number): DataView => new DataView(new ArrayBuffer(size));
export const makeUint8Array = (thing: ArrayBuffer | ArrayBufferView): Uint8Array => thing instanceof ArrayBuffer ? new Uint8Array(thing) : new Uint8Array(thing.buffer, thing.byteOffset, thing.byteLength);
export const encodeString = (whatever: unknown): Uint8Array => encoder.encode(String(whatever));
export const clampInt32 = (n: bigint): number => Math.min(0xffffffff, Number(n));
export const clampInt16 = (n: bigint): number => Math.min(0xffff, Number(n));
