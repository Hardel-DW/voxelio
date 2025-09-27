import { describe, it, expect } from "vitest";
import { Identifier, isIdentifier } from "@/core/Identifier";

describe("Identifier", () => {
	describe("Identifier.of", () => {
		it("should create a basic identifier", () => {
			const result = Identifier.of("minecraft:stone", "block");
			expect(result.get()).toEqual({
				namespace: "minecraft",
				registry: "block",
				resource: "stone"
			});
		});

		it("should create identifier from tag", () => {
			const result = Identifier.of("#minecraft:wool", "tags/block");
			expect(result.get()).toEqual({
				namespace: "minecraft",
				registry: "tags/block",
				resource: "wool"
			});
		});

		it("should handle complex resource paths", () => {
			const result = Identifier.of("enchantplus:sword/life_steal", "enchantment");
			expect(result.get()).toEqual({
				namespace: "enchantplus",
				registry: "enchantment",
				resource: "sword/life_steal"
			});
		});

		it("should auto-prefix with minecraft namespace when none provided", () => {
			const result = Identifier.of("stone", "block");
			expect(result.get()).toEqual({
				namespace: "minecraft",
				registry: "block",
				resource: "stone"
			});
		});

		it("should auto-prefix with minecraft namespace for tags", () => {
			const result = Identifier.of("#sword", "tags/item");
			expect(result.get()).toEqual({
				namespace: "minecraft",
				registry: "tags/item",
				resource: "sword"
			});
		});

		it("should respect explicit namespace when provided", () => {
			const result = Identifier.of("modname:stone", "block");
			expect(result.get()).toEqual({
				namespace: "modname",
				registry: "block",
				resource: "stone"
			});
		});
	});

	describe("toString", () => {
		it("should convert basic identifier to string", () => {
			const identifier = new Identifier({ namespace: "minecraft", registry: "block", resource: "stone" });
			expect(identifier.toString()).toBe("minecraft:stone");
		});

		it("should convert tag identifier to string", () => {
			const identifier = new Identifier({ namespace: "minecraft", registry: "tags/block", resource: "wool" });
			expect(identifier.toString()).toBe("#minecraft:wool");
		});
	});

	describe("equals", () => {
		const identifier = new Identifier({ namespace: "minecraft", registry: "block", resource: "stone" });

		it("should return true for identical identifiers", () => {
			const other = new Identifier({ namespace: "minecraft", registry: "block", resource: "stone" });
			expect(identifier.equals(other)).toBe(true);
		});

		it("should return false for different identifiers", () => {
			const other = new Identifier({ namespace: "minecraft", registry: "block", resource: "dirt" });
			expect(identifier.equals(other)).toBe(false);
		});

		it("should return false for undefined identifier", () => {
			expect(identifier.equals(undefined)).toBe(false);
		});
	});

	describe("toFilePath", () => {
		it("should generate default file path", () => {
			const identifier = new Identifier({ namespace: "minecraft", registry: "block", resource: "stone" });
			expect(identifier.toFilePath()).toBe("data/minecraft/block/stone.json");
		});

		it("should generate custom base path", () => {
			const identifier = new Identifier({ namespace: "minecraft", registry: "block", resource: "stone" });
			expect(identifier.toFilePath("assets")).toBe("assets/minecraft/block/stone.json");
		});

		it("should handle nested resource paths", () => {
			const identifier = new Identifier({ namespace: "enchantplus", registry: "enchantment", resource: "sword/life_steal" });
			expect(identifier.toFilePath()).toBe("data/enchantplus/enchantment/sword/life_steal.json");
		});
	});

	describe("toFileName", () => {
		const identifier = new Identifier({ namespace: "minecraft", registry: "block", resource: "sword/life_steal" });

		it("should return filename without extension", () => {
			expect(identifier.toFileName()).toBe("life_steal");
		});

		it("should return filename with extension", () => {
			expect(identifier.toFileName(true)).toBe("life_steal.json");
		});
	});

	describe("toNamespace", () => {
		it("should format namespace", () => {
			const id1 = new Identifier({ namespace: "minecraft", registry: "block", resource: "stone" });
			const id2 = new Identifier({ namespace: "enchant_plus", registry: "block", resource: "stone" });

			expect(id1.toNamespace()).toBe("Minecraft");
			expect(id2.toNamespace()).toBe("Enchant Plus");
		});
	});

	describe("toResourceName", () => {
		it("should format simple resource name", () => {
			const id = new Identifier({ namespace: "minecraft", registry: "block", resource: "stone" });
			expect(id.toResourceName()).toBe("Stone");
		});

		it("should format complex resource name", () => {
			const id1 = new Identifier({ namespace: "minecraft", registry: "block", resource: "items/diamond_sword" });
			const id2 = new Identifier({ namespace: "minecraft", registry: "block", resource: "sword/life_steal" });

			expect(id1.toResourceName()).toBe("Diamond Sword");
			expect(id2.toResourceName()).toBe("Life Steal");
		});
	});

	describe("toResourcePath", () => {
		it("should format simple path", () => {
			const id = new Identifier({ namespace: "minecraft", registry: "block", resource: "stone" });
			expect(id.toResourcePath()).toBe("Stone");
		});

		it("should format complex path", () => {
			const id = new Identifier({ namespace: "minecraft", registry: "block", resource: "items/weapons/diamond_sword" });
			expect(id.toResourcePath()).toBe("Items - Weapons - Diamond Sword");
		});
	});

	describe("toDisplay", () => {
		it("should format identifier string for display", () => {
			expect(Identifier.toDisplay("minecraft:stone")).toBe("Stone");
			expect(Identifier.toDisplay("minecraft:diamond_sword")).toBe("Diamond Sword");
		});
	});

	describe("normalize", () => {
		it("should auto-prefix identifiers without namespace", () => {
			expect(Identifier.normalize("stone", "block")).toBe("minecraft:stone");
			expect(Identifier.normalize("diamond_sword", "item")).toBe("minecraft:diamond_sword");
		});

		it("should preserve explicit namespaces", () => {
			expect(Identifier.normalize("modname:stone", "block")).toBe("modname:stone");
			expect(Identifier.normalize("minecraft:diamond_sword", "item")).toBe("minecraft:diamond_sword");
		});

		it("should handle tags correctly", () => {
			expect(Identifier.normalize("sword", "tags/item")).toBe("#minecraft:sword");
			expect(Identifier.normalize("modname:weapon", "tags/enchantment")).toBe("#modname:weapon");
		});
	});

	describe("isIdentifier", () => {
		it("should validate correct identifier", () => {
			const identifier = { namespace: "minecraft", registry: "block", resource: "stone" };
			expect(isIdentifier(identifier)).toBe(true);
		});

		it("should reject invalid identifiers", () => {
			expect(isIdentifier({ namespace: "minecraft" })).toBe(false);
			expect(isIdentifier(null)).toBe(false);
			expect(isIdentifier(undefined)).toBe(false);
			expect(isIdentifier(42)).toBe(false);
			expect(isIdentifier("not an identifier")).toBe(false);
			expect(isIdentifier([])).toBe(false);
			expect(isIdentifier({ namespace: "minecraft", registry: 123, resource: "stone" })).toBe(false);
			expect(isIdentifier({ namespace: 123, registry: "block", resource: "stone" })).toBe(false);
			expect(isIdentifier({ namespace: "minecraft", registry: "block", resource: 123 })).toBe(false);
		});
	});
});
