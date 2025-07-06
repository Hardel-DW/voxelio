import { describe, expect, it, beforeEach } from "vitest";
import { Datapack } from "@/core/Datapack";
import { registryFile } from "@test/template/datapack";
import { prepareFiles } from "@test/template/utils";

describe("Registry System", () => {
    let datapack: Datapack;

    beforeEach(() => {
        datapack = new Datapack(prepareFiles(registryFile));
    });

    it("should return all registries", () => {
        const registries = datapack.getRegistry("enchantment");
        expect(registries).toHaveLength(2);
    });

    it("should return all registries with the correct identifier", () => {
        const registries = datapack.getRegistry("tags/enchantment");
        expect(registries).toHaveLength(2);
        expect(registries[0].identifier).toEqual({ namespace: "enchantplus", registry: "tags/enchantment", resource: "armor" });
        expect(registries[1].identifier).toEqual({ namespace: "minecraft", registry: "tags/enchantment", resource: "weapon" });
    });
});
