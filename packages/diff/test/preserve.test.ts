import { describe, expect, it } from "vitest";
import { Differ } from "../src/differ";

const before = {
    "effects": {
        "minecraft:attributes": [
            {
                "id": "minecraft:enchantment.fury",
                "attribute": "minecraft:attack_damage",
                "amount": {
                    "type": "minecraft:linear",
                    "base": 0.075,
                    "per_level_above_first": 0.065
                },
                "operation": "add_multiplied_total"
            }
        ]
    },
    "tags": [
        "#minecraft:non_treasure",
        "#yggdrasil:equipment/item/chestplate",
        "#yggdrasil:equipment/item/chestplate",
        "#yggdrasil:structure/alfheim_tree/random_loot"
    ],
}

const after = {
    "effects": {
        "minecraft:attributes": [
            {
                "attribute": "minecraft:attack_damage",
                "id": "minecraft:enchantment.fury",
                "amount": {
                    "type": "minecraft:linear",
                    "per_level_above_first": 0.065,
                    "base": 0.085,
                },
                "operation": "add_multiplied_total"
            },
            {
                "id": "minecraft:enchantment.fury_descrease",
                "attribute": "minecraft:attack_damage",
                "amount": {
                    "type": "minecraft:linear",
                    "base": 0.075,
                    "per_level_above_first": 0.065
                },
                "operation": "add_multiplied_total"
            }
        ]
    },
    "tags": [
        "#minecraft:non_treasure",
        "#yggdrasil:structure/alfheim_tree/random_loot",
        "#yggdrasil:equipment/item/chestplate",
    ],
}

describe("Preserver", () => {
    it("should preserve the order of the keys", () => {
        const differ = new Differ();
        const result = differ.diff(before, after);
        const apply = Differ.apply(before, result);
        console.log(apply);

        expect(Object.keys(apply)).toHaveLength(2);
        expect(result).toBeDefined();
    });
});
