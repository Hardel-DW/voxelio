export const loot: Record<string, unknown> = {
    "type": "minecraft:chest",
    "pools": [
        {
            "rolls": 0,
            "entries": [
                {
                    "type": "minecraft:item",
                    "name": "minecraft:crying_obsidian",
                    "conditions": [
                        {
                            "condition": "minecraft:entity_properties",
                            "entity": "this",
                            "predicate": {
                                "type_specific": {
                                    "type": "minecraft:player",
                                    "recipes": {
                                        "draft:shaped": true
                                    }
                                }
                            }
                        }
                    ],
                    "functions": []
                }
            ]
        }
    ],
    "random_sequence": "yggdrasil:alfheim_tree/spawner/consumables"
}

export const lootWithEnchant: Record<string, unknown> = {
    type: "minecraft:block",
    pools: [
        {
            bonus_rolls: 0.0,
            conditions: [{ condition: "minecraft:survives_explosion" }],
            functions: [
                {
                    function: "minecraft:furnace_smelt",
                    conditions: [
                        {
                            condition: "minecraft:match_tool",
                            predicate: {
                                predicates: {
                                    "minecraft:enchantments": [
                                        {
                                            enchantments: "enchantplus:tools/auto_smelt",
                                            levels: { min: 1 },
                                        },
                                    ],
                                },
                            },
                        },
                    ],
                },
            ],
            entries: [{ type: "minecraft:item", name: "minecraft:acacia_log" }],
            rolls: 1.0,
        },
    ],
    random_sequence: "minecraft:blocks/acacia_log",
};
