import { describe, expect, it } from "vitest";
import { Differ } from "../src/differ";

const before = {
	type: "minecraft:chest",
	pools: [
		{
			bonus_rolls: 0,
			entries: [
				{
					type: "minecraft:item",
					functions: [
						{
							add: false,
							count: 1,
							function: "minecraft:set_count"
						},
						{
							function: "minecraft:set_potion",
							id: "minecraft:wind_charged"
						}
					],
					name: "minecraft:lingering_potion"
				},
				{
					type: "minecraft:item",
					functions: [
						{
							add: false,
							count: 1,
							function: "minecraft:set_count"
						},
						{
							function: "minecraft:set_potion",
							id: "minecraft:oozing"
						}
					],
					name: "minecraft:lingering_potion"
				},
				{
					type: "minecraft:item",
					functions: [
						{
							add: false,
							count: 1,
							function: "minecraft:set_count"
						},
						{
							function: "minecraft:set_potion",
							id: "minecraft:weaving"
						}
					],
					name: "minecraft:lingering_potion"
				},
				{
					type: "minecraft:item",
					functions: [
						{
							add: false,
							count: 1,
							function: "minecraft:set_count"
						},
						{
							function: "minecraft:set_potion",
							id: "minecraft:infested"
						}
					],
					name: "minecraft:lingering_potion"
				},
				{
					type: "minecraft:item",
					functions: [
						{
							add: false,
							count: 1,
							function: "minecraft:set_count"
						},
						{
							function: "minecraft:set_potion",
							id: "minecraft:strength"
						}
					],
					name: "minecraft:lingering_potion"
				},
				{
					type: "minecraft:item",
					functions: [
						{
							add: false,
							count: 1,
							function: "minecraft:set_count"
						},
						{
							function: "minecraft:set_potion",
							id: "minecraft:swiftness"
						}
					],
					name: "minecraft:lingering_potion"
				},
				{
					type: "minecraft:item",
					functions: [
						{
							add: false,
							count: 1,
							function: "minecraft:set_count"
						},
						{
							function: "minecraft:set_potion",
							id: "minecraft:slow_falling"
						}
					],
					name: "minecraft:lingering_potion"
				}
			],
			rolls: 1
		},
		{
			bonus_rolls: 0,
			entries: [
				{
					type: "minecraft:item",
					functions: [
						{
							add: false,
							count: 1,
							function: "minecraft:set_count"
						}
					],
					name: "minecraft:arrow"
				},
				{
					type: "minecraft:item",
					functions: [
						{
							add: false,
							count: 1,
							function: "minecraft:set_count"
						},
						{
							function: "minecraft:set_potion",
							id: "minecraft:poison"
						}
					],
					name: "minecraft:arrow"
				},
				{
					type: "minecraft:item",
					functions: [
						{
							add: false,
							count: 1,
							function: "minecraft:set_count"
						},
						{
							function: "minecraft:set_potion",
							id: "minecraft:strong_slowness"
						}
					],
					name: "minecraft:arrow"
				},
				{
					type: "minecraft:item",
					functions: [
						{
							add: false,
							count: {
								type: "minecraft:uniform",
								max: 3,
								min: 1
							},
							function: "minecraft:set_count"
						}
					],
					name: "minecraft:fire_charge"
				},
				{
					type: "minecraft:item",
					functions: [
						{
							add: false,
							count: {
								type: "minecraft:uniform",
								max: 3,
								min: 1
							},
							function: "minecraft:set_count"
						}
					],
					name: "minecraft:wind_charge"
				}
			],
			rolls: 1
		}
	],
	random_sequence: "minecraft:spawners/trial_chamber/items_to_drop_when_ominous"
};

const after = {
	type: "minecraft:chest",
	rolls: 10,
	pools: [
		{
			bonus_rolls: 0,
			entries: [
				{
					type: "minecraft:item",
					functions: [
						{
							function: "minecraft:set_potion",
							id: "minecraft:wind_chargeds"
						},
						{
							add: false,
							count: 1,
							function: "minecraft:set_count"
						}
					],
					name: "minecraft:lingering_potion"
				},
				{
					type: "minecraft:item",
					functions: [
						{
							add: false,
							count: 1,
							function: "minecraft:set_count"
						},
						{
							function: "minecraft:set_potion",
							id: "minecraft:oozing"
						}
					],
					name: "minecraft:lingering_potion"
				},
				{
					type: "minecraft:item",
					functions: [
						{
							add: false,
							count: 1,
							function: "minecraft:set_count"
						},
						{
							function: "minecraft:set_potion",
							id: "minecraft:weaving"
						}
					],
					name: "minecraft:lingering_potion"
				},
				{
					type: "minecraft:item",
					functions: [
						{
							add: false,
							count: 1,
							function: "minecraft:set_count"
						},
						{
							function: "minecraft:set_potion",
							id: "minecraft:infested"
						}
					],
					name: "minecraft:lingering_potion"
				},
				{
					type: "minecraft:item",
					functions: [
						{
							add: false,
							count: 1,
							function: "minecraft:set_count"
						},
						{
							function: "minecraft:set_potion",
							id: "minecraft:strength"
						}
					],
					name: "minecraft:lingering_potion"
				},
				{
					type: "minecraft:item",
					functions: [
						{
							add: false,
							count: 1,
							function: "minecraft:set_count"
						},
						{
							function: "minecraft:set_potion",
							id: "minecraft:swiftness"
						}
					],
					name: "minecraft:lingering_potion"
				},
				{
					type: "minecraft:item",
					functions: [
						{
							add: false,
							count: 1,
							function: "minecraft:set_count"
						},
						{
							function: "minecraft:set_potion",
							id: "minecraft:slow_falling"
						}
					],
					name: "minecraft:lingering_potion"
				}
			]
		},
		{
			bonus_rolls: 0,
			entries: [
				{
					type: "minecraft:item",
					functions: [
						{
							add: false,
							count: 1,
							function: "minecraft:set_count"
						},
						{
							function: "minecraft:set_potion",
							id: "minecraft:poison"
						}
					],
					name: "minecraft:arrow"
				},
				{
					type: "minecraft:item",
					functions: [
						{
							add: false,
							count: 1,
							function: "minecraft:set_count"
						}
					],
					name: "minecraft:arrow"
				},
				{
					type: "minecraft:item",
					functions: [
						{
							add: false,
							function: "minecraft:set_count"
						}
					],
					name: "minecraft:fire_charge"
				},
				{
					type: "minecraft:items",
					functions: [
						{
							add: false,
							count: 1,
							function: "minecraft:set_count"
						},
						{
							add: true,
							count: {
								type: "minecraft:uniform",
								max: 5,
								min: 1
							},
							function: "minecraft:set_count"
						}
					],
					name: "minecraft:wind_charge"
				}
			],
			rolls: 1
		}
	],
	random_sequence: "minecraft:spawners/trial_chamber/items_to_drop_when_ominous"
};

describe("E2E", () => {
	it("should diff the two objects and apply patch correctly", () => {
		const patch = new Differ(before, after).diff();
		const applied = Differ.apply(before, patch);
		expect(applied).toEqual(after);
		expect(Array.isArray(patch)).toBe(true);
		expect(patch.length).toBeGreaterThan(0);
	});
});
