import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { NbtFile } from "@/NbtFile";
import { NbtString } from "@/tags/NbtString";

describe("NbtFile", () => {
	it("write", async () => {
		const file = NbtFile.create();
		file.root.set("foo", new NbtString("Hello!"));
		const result = await file.write();
		expect(result).toEqual(new Uint8Array([10, 0, 0, 8, 0, 3, 102, 111, 111, 0, 6, 72, 101, 108, 108, 111, 33, 0]));
	});

	it("read", async () => {
		const array = new Uint8Array([10, 0, 0, 8, 0, 3, 102, 111, 111, 0, 6, 72, 101, 108, 108, 111, 33, 0]);
		const file = await NbtFile.read(array);
		expect(file.name).toEqual("");
		expect(file.root.size).toEqual(1);
		expect(file.root.get("foo")).toEqual(new NbtString("Hello!"));
	});

	it("read (actual file)", async () => {
		const uri = path.resolve(fileURLToPath(import.meta.url), "../taiga_armorer_2.nbt");
		const array = new Uint8Array(fs.readFileSync(uri));
		const file = await NbtFile.read(array);
		expect(file.name).toEqual("");
		expect(file.root.getNumber("DataVersion")).toEqual(3210);
		expect(file.root.getList("entities").length).toEqual(2);
	});
});
