import { describe, it, expect } from "vitest";
import { convertDatapack, extractMetadata } from "@/core";
import { ModPlatforms } from "@/types";
import { createDatapackZip } from "./mock";
import { extractZip } from "@voxelio/zip";

const datapackZip = await createDatapackZip({
	"pack.mcmeta": JSON.stringify({ pack: { pack_format: 61, description: "Test" } }),
	"pack.png": "fake-png-data"
});

const datapackZipWithDescription = await createDatapackZip({
	"pack.mcmeta": JSON.stringify({ pack: { pack_format: 61, description: { text: "Test", extra: [{ text: "Test2" }] } } }),
	"pack.png": "fake-png-data"
});

const datapackZip263 = await createDatapackZip({
	"pack.mcmeta": JSON.stringify({ pack: { min_format: [121, 0], max_format: [121, 0], description: "Nether expansion" } })
});

const datapackZipUnknownFormat = await createDatapackZip({
	"pack.mcmeta": JSON.stringify({ pack: { pack_format: 999, description: "From the future" } })
});

describe("convertDatapack", async () => {
	it("should place Fabric mod file at correct location", async () => {
		const result = await convertDatapack(datapackZip, [
			ModPlatforms.FABRIC,
			ModPlatforms.QUILT,
			ModPlatforms.FORGE,
			ModPlatforms.NEOFORGE
		]);
		const files = await extractZip(new Uint8Array(await result.arrayBuffer()));
		const metadata = await extractMetadata(datapackZip, "My Cool Datapack");
		expect(files).toHaveProperty("fabric.mod.json");
		expect(files).toHaveProperty("quilt.mod.json");
		expect(files).toHaveProperty("META-INF/mods.toml");
		expect(files).toHaveProperty("META-INF/neoforge.mods.toml");
		expect(metadata.description).toBe("Test");
		expect(metadata.icon).toBe("pack.png");
		expect(metadata.id).toBe("my_cool_datapack");
		expect(metadata.name).toBe("My Cool Datapack");
	});

	it("should place Fabric mod file at correct location", async () => {
		const result = await convertDatapack(datapackZipWithDescription, [ModPlatforms.FABRIC]);
		const files = await extractZip(new Uint8Array(await result.arrayBuffer()));
		const metadata = await extractMetadata(datapackZipWithDescription, "My Cool Datapack");
		expect(files).toHaveProperty("fabric.mod.json");
		expect(metadata.description).toBe("TestTest2");
	});

	it("should read the description and version of a 26.3 datapack", async () => {
		const metadata = await extractMetadata(datapackZip263, "Incendium_v5.5.4+26.3");
		expect(metadata.description).toBe("Nether expansion");
		expect(metadata.version).toBe("26.3");
		expect(metadata.id).toBe("incendium_v5_5_4_26_3");
	});

	it("should keep the description when the format is unknown", async () => {
		const metadata = await extractMetadata(datapackZipUnknownFormat, "Future");
		expect(metadata.description).toBe("From the future");
		expect(metadata.version).toBe("1.0.0");
	});

	it("should write a valid id even when the metadata id is not one", async () => {
		const result = await convertDatapack(datapackZip, [ModPlatforms.FABRIC, ModPlatforms.NEOFORGE], {
			...(await extractMetadata(datapackZip, "Test")),
			id: "1.21 My-Pack"
		});
		const files = await extractZip(new Uint8Array(await result.arrayBuffer()));
		const fabric = JSON.parse(new TextDecoder().decode(files["fabric.mod.json"]));
		expect(fabric.id).toBe("datapack_1_21_my_pack");
		expect(new TextDecoder().decode(files["META-INF/neoforge.mods.toml"])).toContain('modId = "datapack_1_21_my_pack"');
	});
});
