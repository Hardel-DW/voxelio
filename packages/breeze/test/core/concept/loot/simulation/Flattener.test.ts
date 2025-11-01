import { describe, expect, it } from "vitest";
import { LootTableFlattener } from "@/core/calculation/LootTableFlattener";
import { LootDataDrivenToVoxelFormat } from "@/core/schema/loot/Parser";
import {
	simpleFlat,
	parentReference,
	childReference,
	cyclicFirst,
	cyclicSecond,
	tagged,
	altParent,
	altChildA,
	altChildB,
	deepTop,
	deepMid,
	deepBottom
} from "@test/mock/concept/loot";
import { itemTags } from "@test/mock/tags/item";

describe("LootTableFlattener", () => {
	it("flattens a simple loot table", () => {
		const simple = LootDataDrivenToVoxelFormat({ element: simpleFlat });
		const flattener = new LootTableFlattener([simple]);
		const result = flattener.flatten("test:simple_flat");
		expect(result).toHaveLength(1);
		const entry = result[0];
		expect(entry.name).toBe("minecraft:diamond");
		expect(entry.probability).toBe(1);
		expect(entry.weight).toBe(1);
		expect(entry.path).toEqual(["test:simple_flat"]);
		expect(entry.cycle).toBeFalsy();
		expect(entry.unresolved).toBeFalsy();
	});

	it("resolves nested loot table references", () => {
		const parent = LootDataDrivenToVoxelFormat({ element: parentReference });
		const child = LootDataDrivenToVoxelFormat({ element: childReference });
		const flattener = new LootTableFlattener([parent, child]);
		const result = flattener.flatten("test:parent");
		expect(result).toHaveLength(1);
		const entry = result[0];
		expect(entry.name).toBe("minecraft:emerald");
		expect(entry.path).toEqual(["test:parent", "test:child"]);
		expect(entry.probability).toBe(1);
		expect(entry.weight).toBe(1);
	});

	it("returns unresolved entries when referenced table is missing", () => {
		const parent = LootDataDrivenToVoxelFormat({ element: parentReference });
		const flattener = new LootTableFlattener([parent]);
		const result = flattener.flatten("test:parent");
		expect(result).toHaveLength(1);
		const entry = result[0];
		expect(entry.unresolved).toBe(true);
		expect(entry.name).toBe("test:child");
		expect(entry.path).toEqual(["test:parent", "test:child"]);
	});

	it("marks cycles to avoid infinite recursion", () => {
		const first = LootDataDrivenToVoxelFormat({ element: cyclicFirst });
		const second = LootDataDrivenToVoxelFormat({ element: cyclicSecond });
		const flattener = new LootTableFlattener([first, second]);
		const result = flattener.flatten("test:first");
		expect(result).toHaveLength(1);
		const entry = result[0];
		expect(entry.cycle).toBe(true);
		expect(entry.name).toBe("test:first");
		expect(entry.path).toEqual(["test:first", "test:second", "test:first"]);
	});

	it("resolves tag based entries using provided registries", () => {
		const taggedTable = LootDataDrivenToVoxelFormat({ element: tagged });
		const flattener = new LootTableFlattener([taggedTable], itemTags);
		const result = flattener.flatten("test:tagged");
		expect(result).toHaveLength(2);
		const names = result.map((entry) => entry.name).sort();
		expect(names).toEqual(["minecraft:gold_ingot", "minecraft:iron_ingot"]);
		for (const entry of result) {
			expect(entry.resolvedFromTag).toBe(true);
			expect(entry.probability).toBeCloseTo(0.5, 5);
			expect(entry.weight).toBeCloseTo(0.5, 5);
		}
	});

	it("keeps weight ratios for alternatives", () => {
		const parent = LootDataDrivenToVoxelFormat({ element: altParent });
		const childA = LootDataDrivenToVoxelFormat({ element: altChildA });
		const childB = LootDataDrivenToVoxelFormat({ element: altChildB });
		const flattener = new LootTableFlattener([parent, childA, childB]);
		const result = flattener.flatten("test:alt_parent");
		expect(result).toHaveLength(2);
		const emerald = result.find((entry) => entry.name === "minecraft:emerald");
		const diamond = result.find((entry) => entry.name === "minecraft:diamond");
		expect(emerald?.probability).toBeCloseTo(0.25, 5);
		expect(diamond?.probability).toBeCloseTo(0.75, 5);
		expect(emerald?.weight).toBeCloseTo(1, 5);
		expect(diamond?.weight).toBeCloseTo(3, 5);
	});

	it("supports deep references", () => {
		const top = LootDataDrivenToVoxelFormat({ element: deepTop });
		const mid = LootDataDrivenToVoxelFormat({ element: deepMid });
		const bottom = LootDataDrivenToVoxelFormat({ element: deepBottom });
		const flattener = new LootTableFlattener([top, mid, bottom]);
		const full = flattener.flatten("test:top");
		expect(full).toHaveLength(1);
		const entry = full[0];
		expect(entry.name).toBe("minecraft:gold_block");
		expect(entry.path).toEqual(["test:top", "test:mid", "test:bottom"]);
		const limited = flattener.flatten("test:top", { maxDepth: 1 });
		expect(limited).toHaveLength(1);
		expect(limited[0].unresolved).toBe(true);
		expect(limited[0].name).toBe("test:mid");
	});
});
