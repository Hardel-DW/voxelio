import { describe, it, expect, beforeAll } from "vitest";
import { PackGraph } from "@/index";
import type { VanillaMcdocSymbols } from "@/index";
import { getTestSymbols } from "@test/mock/setup";
import { prepareFiles } from "@test/mock/utils";
import { loot } from "@test/mock/concept/loot";
import { shaped } from "@test/mock/concept/recipe";

describe("PackGraph", () => {
	let symbols: VanillaMcdocSymbols;
	beforeAll(async () => {
		symbols = await getTestSymbols();
	});

	describe("getSubgraph", () => {
		it("should extract recipe reference from loot table", () => {
			const files = prepareFiles({
				"data/draft/loot_table/test.json": loot,
				"data/draft/recipe/shaped.json": shaped
			});

			const graph = new PackGraph(files, symbols, "1.21.4");
			const subgraph = graph.getSubgraph("draft:test", 0);
			const node = subgraph.get("draft:test");
			expect(node).toBeDefined();
			expect(node?.refs.has("draft:shaped")).toBe(true);
		});
	});

	describe("generateAll", () => {
		it("should build bidirectional graph", () => {
			const files = prepareFiles({
				"data/draft/recipe/shaped.json": shaped,
				"data/draft/loot_table/test.json": loot
			});

			const graph = new PackGraph(files, symbols, "1.21.4");
			graph.generateAll();

			const lootNode = graph.getGraph().get("draft:test");
			expect(lootNode).toBeDefined();
			expect(lootNode?.refs.has("draft:shaped")).toBe(true);

			const recipeNode = graph.getGraph().get("draft:shaped");
			expect(recipeNode).toBeDefined();
			expect(recipeNode?.referencedBy.has("draft:test")).toBe(true);
		});
	});
});
