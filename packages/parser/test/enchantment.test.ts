import { describe, it, expect, beforeAll } from "vitest";
import { getFileReferences, buildDependencyGraph } from "@/index";
import type { VanillaMcdocSymbols, DatapackFile } from "@/index";
import { getTestSymbols } from "@test/mock/setup";
import { autoSmelt } from "@test/mock/concept/enchantment";
import { miningAlteration } from "@test/mock/concept/tag";
import { lootWithEnchant } from "@test/mock/concept/loot";

describe("enchantment/tag/loot dependencies", () => {
	let symbols: VanillaMcdocSymbols;
	beforeAll(async () => {
		symbols = await getTestSymbols();
	});

	describe("getFileReferences", () => {
		it("should extract enchantment reference from loot table", () => {
			const file: DatapackFile = { namespace: "minecraft", registry: "loot_table", path: "blocks/acacia_log", data: lootWithEnchant };
			const refs = getFileReferences(file, symbols, "1.21.11");
			expect(refs).toContain("enchantplus:tools/auto_smelt");
		});

		it("should extract tag references from enchantment", () => {
			const file: DatapackFile = { namespace: "enchantplus", registry: "enchantment", path: "tools/auto_smelt", data: autoSmelt };
			const refs = getFileReferences(file, symbols, "1.21.11");
			expect(refs).toContain("#enchantplus:exclusive_set/mining_alteration");
		});

		it("should extract enchantment references from tag", () => {
			const file: DatapackFile = { namespace: "enchantplus", registry: "tags/enchantment", path: "exclusive_set/mining_alteration", data: miningAlteration };
			const refs = getFileReferences(file, symbols, "1.21.11");
			expect(refs).toContain("enchantplus:tools/auto_smelt");
		});
	});

	describe("buildDependencyGraph", () => {
		it("should build circular dependency graph", () => {
			const files: DatapackFile[] = [
				{ namespace: "enchantplus", registry: "enchantment", path: "tools/auto_smelt", data: autoSmelt },
				{ namespace: "enchantplus", registry: "tags/enchantment", path: "exclusive_set/mining_alteration", data: miningAlteration },
			];

			const graph = buildDependencyGraph(files, symbols, "1.21.11");
			const enchantNode = graph.get("enchantplus:tools/auto_smelt");
			const tagNode = graph.get("enchantplus:exclusive_set/mining_alteration");
			expect(enchantNode?.refs.has("enchantplus:exclusive_set/mining_alteration")).toBe(true);
			expect(tagNode?.refs.has("enchantplus:tools/auto_smelt")).toBe(true);
		});
	});
});
