
```json Patch Changelog
[
    {
        "identifier": {
            "namespace": "enchantplus",
            "registry": "enchantment",
            "resource": "armor/lifeplus"
        },
        "patch": [
            {
                "op": "replace",
                "path": "/exclusiveSet"
            },
            {
                "op": "replace",
                "path": "/maxLevel",
                "value": 9
            },
            {
                "op": "replace",
                "path": "/maxCostPerLevelAboveFirst",
                "value": 6
            },
            {
                "op": "remove",
                "path": "/tags/0"
            },
            {
                "op": "add",
                "path": "/disabledEffects/0",
                "value": "minecraft:attributes"
            }
        ],
        "updatedAt": "2026-01-01T11:21:44.228Z"
    }
]
```

```json Input Files
{
    "description": {
        "translate": "enchantment.enchantplus.lifeplus",
        "fallback": "Life+"
    },
    "exclusive_set": "#enchantplus:exclusive_set/armor",
    "supported_items": "#minecraft:enchantable/armor",
    "weight": 8,
    "max_level": 5,
    "min_cost": {
        "base": 9,
        "per_level_above_first": 9
    },
    "max_cost": {
        "base": 21,
        "per_level_above_first": 11
    },
    "anvil_cost": 1,
    "slots": [
        "armor"
    ],
    "effects": {
        "minecraft:attributes": [
            {
                "id": "minecraft:enchantment.lifeplus",
                "attribute": "minecraft:max_health",
                "amount": {
                    "type": "minecraft:linear",
                    "base": 2,
                    "per_level_above_first": 2
                },
                "operation": "add_value"
            }
        ]
    }
}
```

```json Ouput Files
{
    "description": {
        "translate": "enchantment.enchantplus.lifeplus",
        "fallback": "Life+"
    },
    "exclusive_set": "#enchantplus:exclusive_set/armor",
    "supported_items": "#minecraft:enchantable/armor",
    "weight": 8,
    "max_level": 9,
    "min_cost": {
        "base": 9,
        "per_level_above_first": 9
    },
    "max_cost": {
        "base": 21,
        "per_level_above_first": 6
    },
    "anvil_cost": 1,
    "slots": [
        "armor"
    ],
    "effects": {}
}
```