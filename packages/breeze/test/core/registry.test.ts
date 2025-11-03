import { describe, expect, it } from "vitest";
import { Datapack } from "@/core/Datapack";
import { prepareFiles } from "@test/mock/utils";

const datapack = new Datapack(
	prepareFiles({
		"data/enchantplus/enchantment/armor/fury.json": { foo: "bar" },
		"data/minecraft/enchantment/attack_speed.json": { foo: "bar" },
		"data/minecraft/enchantment_provider/villager.json": { foo: "bar" },
		"data/enchantplus/tags/enchantment/armor.json": { values: ["enchantplus:fury"] },
		"data/minecraft/tags/enchantment/weapon.json": { values: ["minecraft:attack_speed"] }
	})
);

describe("Registry System", () => {
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
