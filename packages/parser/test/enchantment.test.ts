import { describe, it, expect, beforeAll } from "vitest";
import { PackGraph } from "@/index";
import type { VanillaMcdocSymbols } from "@/index";
import { getTestSymbols } from "@test/mock/setup";
import { prepareFiles } from "@test/mock/utils";
import { autoSmelt } from "@test/mock/concept/enchantment";
import { miningAlteration } from "@test/mock/concept/tag";
import { lootWithEnchant } from "@test/mock/concept/loot";

describe("enchantment/tag/loot dependencies", () => {
	let symbols: VanillaMcdocSymbols;
	beforeAll(async () => {
		symbols = await getTestSymbols();
	});

	describe("getSubgraph", () => {
		it("should extract enchantment reference from loot table", () => {
			const files = prepareFiles({
				"data/minecraft/loot_table/blocks/acacia_log.json": lootWithEnchant,
				"data/enchantplus/enchantment/tools/auto_smelt.json": autoSmelt
			});

			const graph = new PackGraph(files, symbols, "1.21.4");
			const subgraph = graph.getSubgraph("minecraft:blocks/acacia_log", 0);

			const node = subgraph.get("minecraft:blocks/acacia_log");
			expect(node).toBeDefined();
			expect(node?.refs.has("enchantplus:tools/auto_smelt")).toBe(true);
		});

		it("should extract tag references from enchantment", () => {
			const files = prepareFiles({
				"data/enchantplus/enchantment/tools/auto_smelt.json": autoSmelt,
				"data/enchantplus/tags/enchantment/exclusive_set/mining_alteration.json": miningAlteration
			});

			const graph = new PackGraph(files, symbols, "1.21.4");
			const subgraph = graph.getSubgraph("enchantplus:tools/auto_smelt", 0);

			const node = subgraph.get("enchantplus:tools/auto_smelt");
			expect(node).toBeDefined();
			expect(node?.refs.has("enchantplus:exclusive_set/mining_alteration")).toBe(true);
		});

		it("should extract enchantment references from tag", () => {
			const files = prepareFiles({
				"data/enchantplus/tags/enchantment/exclusive_set/mining_alteration.json": miningAlteration,
				"data/enchantplus/enchantment/tools/auto_smelt.json": autoSmelt
			});

			const graph = new PackGraph(files, symbols, "1.21.4");
			const subgraph = graph.getSubgraph("enchantplus:exclusive_set/mining_alteration", 0);

			const node = subgraph.get("enchantplus:exclusive_set/mining_alteration");
			expect(node).toBeDefined();
			expect(node?.refs.has("enchantplus:tools/auto_smelt")).toBe(true);
		});
	});

	describe("generateAll", () => {
		it("should build circular dependency graph", () => {
			const files = prepareFiles({
				"data/enchantplus/enchantment/tools/auto_smelt.json": autoSmelt,
				"data/enchantplus/tags/enchantment/exclusive_set/mining_alteration.json": miningAlteration
			});

			const graph = new PackGraph(files, symbols, "1.21.4");
			graph.generateAll();

			const enchantNode = graph.getGraph().get("enchantplus:tools/auto_smelt");
			const tagNode = graph.getGraph().get("enchantplus:exclusive_set/mining_alteration");

			expect(enchantNode?.refs.has("enchantplus:exclusive_set/mining_alteration")).toBe(true);
			expect(tagNode?.refs.has("enchantplus:tools/auto_smelt")).toBe(true);
		});
	});

	describe("canBeDeleted", () => {
		it("should return false when file is referenced", () => {
			const files = prepareFiles({
				"data/enchantplus/enchantment/tools/auto_smelt.json": autoSmelt,
				"data/enchantplus/tags/enchantment/exclusive_set/mining_alteration.json": miningAlteration
			});

			const graph = new PackGraph(files, symbols, "1.21.4");
			expect(graph.canBeDeleted("enchantplus:exclusive_set/mining_alteration")).toBe(false);
		});

		it("should return true when file is not referenced", () => {
			const files = prepareFiles({
				"data/enchantplus/enchantment/tools/auto_smelt.json": autoSmelt
			});

			const graph = new PackGraph(files, symbols, "1.21.4");
			expect(graph.canBeDeleted("enchantplus:tools/auto_smelt")).toBe(true);
		});
	});
});
