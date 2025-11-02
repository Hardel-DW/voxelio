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

describe("convertDatapack", async () => {
    it("should place Fabric mod file at correct location", async () => {
        const result = await convertDatapack(datapackZip, [ModPlatforms.FABRIC, ModPlatforms.QUILT, ModPlatforms.FORGE, ModPlatforms.NEOFORGE]);
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
});