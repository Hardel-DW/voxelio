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