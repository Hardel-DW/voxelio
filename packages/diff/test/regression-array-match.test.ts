import { describe, expect, it } from "vitest";
import { Differ } from "../src/Differ";

describe("Regression: Mojang loot data reordering", () => {
	it("should apply patch when replacing and reordering pools", () => {
		const before = {
			pools: [
				{
					rolls: 3
				},
				{
					entries: {
						type: "minecraft:set_nbt",
						data: { foo: 1 }
					}
				}
			]
		};
		const after = {
			pools: [
				{
					bonus_rolls: { min: 0, max: 1 }
				},
				{
					entries: {
						type: "minecraft:set_components",
						components: [{ name: "minecraft:custom_model_data", value: 2 }]
					}
				}
			]
		};

		const patch = new Differ(before, after).diff();
		const applied = Differ.apply(structuredClone(before), patch);

		expect(() => Differ.apply(structuredClone(before), patch)).not.toThrow();
		expect(applied).toEqual(after);
		expect(JSON.stringify(applied)).toBe(JSON.stringify(after));
	});
});
