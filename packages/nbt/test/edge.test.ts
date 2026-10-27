import { describe, expect, it } from "vitest";
import { NbtError } from "@/error";
import { NbtFile } from "@/file";
import { LazyNbtFile } from "@/lazy";
import { nbt } from "@/tags";
import { Endian, NbtType } from "@/types";
import { NbtWriter } from "@/writer";

const hex = (value: string): Uint8Array => Uint8Array.from(value.split(" "), (byte) => Number.parseInt(byte, 16));
const toHex = (bytes: Uint8Array): string => Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(" ");

describe("Malformed input", () => {
	const negativeByteArray = hex("0a 00 00 07 00 01 61 ff ff ff f8 00");

	it("rejects negative lengths instead of looping forever when skipping", () => {
		expect(() => NbtFile.readSelective(negativeByteArray, ["other"])).toThrow(NbtError);
		expect(() => new LazyNbtFile(negativeByteArray).keys()).toThrow(NbtError);
		expect(() => NbtFile.read(negativeByteArray)).toThrow(NbtError);
	});

	it("rejects a non-empty list of End tags", () => {
		expect(() => NbtFile.read(hex("0a 00 00 09 00 01 61 00 7f ff ff ff 00"))).toThrow(NbtError);
	});

	it("rejects list lengths larger than the remaining data before allocating", () => {
		expect(() => NbtFile.read(hex("0a 00 00 09 00 01 61 03 7f ff ff ff 00"))).toThrow(NbtError);
	});

	it("rejects nesting deeper than 512", () => {
		const parts = ["0a 00 00 09 00 01 61"];
		for (let i = 0; i < 1000; i++) {
			parts.push("09 00 00 00 01");
		}
		parts.push("00 00 00 00 00");
		expect(() => NbtFile.read(hex(parts.join(" ")))).toThrow(NbtError);
	});
});

describe("Strings", () => {
	it("decodes Java modified UTF-8", () => {
		// DataOutput.writeUTF("a\u0000😀")
		const file = NbtFile.read(hex("0a 00 00 08 00 01 73 00 09 61 c0 80 ed a0 bd ed b8 80 00"));
		expect(file.getString("s")).toBe("a\u0000😀");
	});

	it("encodes modified UTF-8 for Java and standard UTF-8 for Bedrock", () => {
		const root = nbt.compound({ s: nbt.string("a\u0000😀é") });
		expect(toHex(new NbtFile("", root).write())).toBe("0a 00 00 08 00 01 73 00 0b 61 c0 80 ed a0 bd ed b8 80 c3 a9 00");
		const bedrock = new NbtFile("", root, 0, Endian.Little).write();
		expect(toHex(bedrock)).toBe("0a 00 00 08 01 00 73 08 00 61 00 f0 9f 98 80 c3 a9 00");
		expect(NbtFile.read(bedrock, { endian: Endian.Little }).getString("s")).toBe("a\u0000😀é");
	});

	it("round-trips non-ASCII and long strings", () => {
		const values = ["", "minecraft:stone", "日本語のテキスト", "x".repeat(40), `${"é".repeat(30)}🎉`];
		const root = nbt.compound(Object.fromEntries(values.map((value, i) => [`k${i}`, nbt.string(value)])));
		const file = NbtFile.read(new NbtFile("", root).write());
		for (const [i, value] of values.entries()) {
			expect(file.getString(`k${i}`)).toBe(value);
		}
	});

	it("throws on strings longer than 65535 bytes", () => {
		const file = new NbtFile("", nbt.compound({ s: nbt.string("x".repeat(70000)) }));
		expect(() => file.write()).toThrow(NbtError);
	});
});

describe("Writer", () => {
	it("grows from an empty initial buffer", () => {
		const writer = new NbtWriter(Endian.Big, 0);
		writer.writeI32(1);
		expect(writer.getData().length).toBe(4);
	});

	it("writes a list filled after creation with the type of its items", () => {
		const list = nbt.list();
		list.items.push(nbt.int(5));
		const file = NbtFile.read(new NbtFile("", nbt.compound({ list })).write());
		expect(file.getList("list")?.listType).toBe(NbtType.Int);
	});

	it("throws on heterogeneous lists", () => {
		const list = nbt.list([nbt.int(1), nbt.string("a")]);
		expect(() => new NbtFile("", nbt.compound({ list })).write()).toThrow(NbtError);
	});

	it("round-trips typed arrays in both byte orders", () => {
		const root = nbt.compound({
			b: nbt.byteArray([1, -2, 127]),
			i: nbt.intArray([1, -2, 0x12345678]),
			l: nbt.longArray([1n, -2n, 0x123456789abcdefn])
		});
		for (const endian of [Endian.Big, Endian.Little]) {
			const file = NbtFile.read(new NbtFile("", root, 0, endian).write(), { endian });
			expect(file.get("b")).toEqual(root.entries.get("b"));
			expect(file.get("i")).toEqual(root.entries.get("i"));
			expect(file.get("l")).toEqual(root.entries.get("l"));
		}
	});

	it("does not alias the input buffer for byte arrays", () => {
		const data = hex("0a 00 00 07 00 01 61 00 00 00 01 05 00");
		const tag = NbtFile.read(data).get("a");
		if (tag?.type === NbtType.ByteArray) {
			tag.value[0] = 9;
		}
		expect(data[11]).toBe(5);
	});
});

describe("Bedrock header", () => {
	it("keeps the header version through a read/write round trip", () => {
		const written = new NbtFile("", nbt.compound({ a: nbt.int(1) }), 0, Endian.Little, 10).write();
		const file = NbtFile.read(written, { endian: Endian.Little, bedrockHeader: 8 });
		expect(file.bedrockHeader).toBe(10);
		expect(file.write()).toEqual(written);
	});
});

describe("LazyNbtFile.toCompound", () => {
	it("keeps file order regardless of access order", () => {
		const lazy = new LazyNbtFile(new NbtFile("", nbt.compound({ a: nbt.int(1), b: nbt.int(2) })).write());
		lazy.get("b");
		expect([...lazy.toCompound().entries.keys()]).toEqual(["a", "b"]);
	});
});
