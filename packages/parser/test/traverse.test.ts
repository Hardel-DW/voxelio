import { describe, it, expect, beforeAll } from "vitest";
import { getFileReferences, buildDependencyGraph } from "@/index";
import type { VanillaMcdocSymbols, DatapackFile } from "@/index";
import { getTestSymbols } from "@test/mock/setup";
import { loot } from "@test/mock/concept/loot";
import { shaped } from "@test/mock/concept/recipe";

describe("traverse", () => {
	let symbols: VanillaMcdocSymbols;
	beforeAll(async () => { symbols = await getTestSymbols() });

	describe("getFileReferences", () => {
		it("should extract recipe reference from loot table predicate", () => {
			const file: DatapackFile = { namespace: "draft", registry: "loot_table", path: "test", data: loot };
			const refs = getFileReferences(file, symbols, "1.21.4");
			expect(refs).toContain("draft:shaped");
		});
	});

	describe("buildDependencyGraph", () => {
		it("should build bidirectional graph with known files only", () => {
			const files: DatapackFile[] = [
				{ namespace: "draft", registry: "recipe", path: "shaped", data: shaped },
				{ namespace: "draft", registry: "loot_table", path: "test", data: loot },
			];

			const graph = buildDependencyGraph(files, symbols, "1.21.4");
			const lootNode = graph.get("draft:test");
			expect(lootNode).toBeDefined();
			expect(lootNode?.refs.has("draft:shaped")).toBe(true);

			const recipeNode = graph.get("draft:shaped");
			expect(recipeNode).toBeDefined();
			expect(recipeNode?.referencedBy.has("draft:test")).toBe(true);
		});
	});
});
