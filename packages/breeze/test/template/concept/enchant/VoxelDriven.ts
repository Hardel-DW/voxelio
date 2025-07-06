import type { EnchantmentProps } from "@/core/schema/enchant/types";
import type { VoxelRegistryElement } from "@/index";

const prefiledProperties = {
    maxLevel: 1,
    weight: 2,
    anvilCost: 4,
    minCostBase: 20,
    minCostPerLevelAboveFirst: 9,
    maxCostBase: 65,
    maxCostPerLevelAboveFirst: 9,
    exclusiveSet: "",
    primaryItems: "",
    supportedItems: "",
    mode: "normal" as const,
    slots: [],
    tags: [],
    disabledEffects: [],
    effects: {}
};

export const createMockEnchantmentElement = (data: Partial<EnchantmentProps> = {}): VoxelRegistryElement<EnchantmentProps> => ({
    identifier: "foo",
    data: {
        identifier: { namespace: "namespace", resource: "enchantment", registry: "foo" },
        description: { translate: "enchantment.test.foo" },
        exclusiveSet: undefined,
        supportedItems: "#minecraft:sword",
        primaryItems: undefined,
        maxLevel: 1,
        weight: 1,
        anvilCost: 1,
        minCostBase: 1,
        minCostPerLevelAboveFirst: 1,
        maxCostBase: 10,
        maxCostPerLevelAboveFirst: 10,
        effects: undefined,
        slots: ["head", "chest"],
        tags: ["#minecraft:enchantable/bow", "#minecraft:enchantable/armor"],
        disabledEffects: [],
        mode: "normal",
        ...data
    }
});

export const createComplexMockElement = (data: Partial<EnchantmentProps> = {}): VoxelRegistryElement<EnchantmentProps> => ({
    identifier: "foo",
    data: {
        identifier: { namespace: "enchantplus", registry: "enchantment", resource: "bow/accuracy_shot" },
        anvilCost: 4,
        description: { translate: "enchantment.test.foo", fallback: "Enchantment Test" },
        disabledEffects: [],
        effects: {
            "minecraft:projectile_spawned": [
                {
                    effect: {
                        type: "minecraft:run_function",
                        function: "enchantplus:actions/accuracy_shot/on_shoot"
                    }
                }
            ]
        },
        exclusiveSet: ["minecraft:efficiency", "minecraft:unbreaking"],
        maxLevel: 1,
        mode: "normal",
        minCostBase: 1,
        minCostPerLevelAboveFirst: 1,
        maxCostBase: 10,
        maxCostPerLevelAboveFirst: 10,
        primaryItems: undefined,
        supportedItems: "#voxel:enchantable/range",
        slots: ["mainhand", "offhand"],
        tags: [
            "#minecraft:non_treasure",
            "#yggdrasil:structure/alfheim_tree/ominous_vault",
            "#yggdrasil:structure/alfheim_tree/ominous_vault/floor",
            "#yggdrasil:structure/asflors/common"
        ],
        weight: 2,
        ...data
    }
});

export const VOXEL_ELEMENTS: EnchantmentProps[] = [
    {
        identifier: { namespace: "enchantplus", registry: "enchantment", resource: "bow/accuracy_shot" },
        description: {
            translate: "enchantment.enchantplus.accuracy_shot",
            fallback: "Accuracy Shot"
        },
        maxLevel: 1,
        weight: 2,
        anvilCost: 4,
        minCostBase: 20,
        minCostPerLevelAboveFirst: 9,
        maxCostBase: 65,
        maxCostPerLevelAboveFirst: 9,
        exclusiveSet: "",
        primaryItems: "",
        mode: "normal" as const,
        disabledEffects: [],
        effects: {},
        supportedItems: "#voxel:enchantable/range",
        tags: [
            "minecraft:non_treasure",
            "yggdrasil:structure/alfheim_tree/ominous_vault",
            "yggdrasil:structure/alfheim_tree/random_loot",
            "yggdrasil:structure/asflors/common"
        ],

        slots: ["mainhand", "offhand"]
    },
    {
        identifier: { namespace: "enchantplus", registry: "enchantment", resource: "boots/agility" },
        description: {
            translate: "enchantment.enchantplus.agility",
            fallback: "Agility"
        },
        maxLevel: 1,
        weight: 2,
        anvilCost: 4,
        minCostBase: 20,
        minCostPerLevelAboveFirst: 9,
        maxCostBase: 65,
        maxCostPerLevelAboveFirst: 9,
        exclusiveSet: "",
        primaryItems: "",
        mode: "normal" as const,
        disabledEffects: [],
        effects: {},
        supportedItems: "#minecraft:enchantable/foot_armor",
        tags: ["minecraft:non_treasure"],
        slots: ["feet"]
    },
    {
        identifier: { namespace: "enchantplus", registry: "enchantment", resource: "elytra/armored" },
        description: {
            translate: "enchantment.enchantplus.armored",
            fallback: "Armored"
        },
        maxLevel: 1,
        weight: 1,
        anvilCost: 4,
        minCostBase: 20,
        minCostPerLevelAboveFirst: 9,
        maxCostBase: 65,
        maxCostPerLevelAboveFirst: 9,
        exclusiveSet: "",
        primaryItems: "",
        mode: "normal" as const,
        disabledEffects: [],
        effects: {},
        supportedItems: "#voxel:enchantable/elytra",
        tags: ["minecraft:non_treasure"],
        slots: ["chest"]
    },
    {
        identifier: { namespace: "enchantplus", registry: "enchantment", resource: "sword/attack_speed" },
        description: {
            translate: "enchantment.enchantplus.harvest",
            fallback: "Harvest"
        },
        maxLevel: 1,
        weight: 2,
        anvilCost: 4,
        minCostBase: 20,
        minCostPerLevelAboveFirst: 9,
        maxCostBase: 65,
        maxCostPerLevelAboveFirst: 9,
        exclusiveSet: "",
        primaryItems: "",
        mode: "normal" as const,
        disabledEffects: [],
        effects: {},
        supportedItems: "#voxel:enchantable/hoes",
        tags: ["minecraft:non_treasure", "foo:bar"],
        slots: ["mainhand"]
    },
    {
        identifier: { namespace: "enchantplus", registry: "enchantment", resource: "sword/poison_aspect" },
        description: {
            translate: "enchantment.enchantplus.poison_aspect",
            fallback: "Poison Aspect"
        },
        maxLevel: 1,
        weight: 2,
        anvilCost: 4,
        minCostBase: 20,
        minCostPerLevelAboveFirst: 9,
        maxCostBase: 65,
        maxCostPerLevelAboveFirst: 9,
        exclusiveSet: "#enchantplus:exclusive_set/aspect",
        primaryItems: "#minecraft:enchantable/sword",
        mode: "normal" as const,
        disabledEffects: [],
        effects: {},
        supportedItems: "#minecraft:enchantable/weapon",
        tags: ["minecraft:non_treasure", "enchantplus:sword/poison_aspect"],
        slots: ["mainhand"]
    }
];

export const attack_speed_element: EnchantmentProps[] = [
    {
        exclusiveSet: undefined,
        primaryItems: undefined,
        identifier: {
            namespace: "enchantplus",
            registry: "enchantment",
            resource: "sword/attack_speed"
        },
        description: {
            translate: "enchantment.enchantplus.attack_speed",
            fallback: "Attack Speed"
        },
        supportedItems: "#minecraft:enchantable/sword",
        maxLevel: 2,
        weight: 4,
        anvilCost: 2,
        minCostBase: 8,
        minCostPerLevelAboveFirst: 11,
        maxCostBase: 21,
        maxCostPerLevelAboveFirst: 9,
        effects: {},
        tags: ["#minecraft:non_treasure", "#yggdrasil:equipment/item/sword", "#yggdrasil:structure/alfheim_tree/random_loot"],
        slots: ["mainhand"],
        mode: "normal",
        disabledEffects: []
    }
];

export const VOXEL_TEMPLATE_ENCHANTMENT: VoxelRegistryElement<EnchantmentProps>[] = [
    {
        identifier: "00000000-0000-0000-0000-000000000000",
        data: {
            identifier: { namespace: "enchantplus", registry: "enchantment", resource: "bow/accuracy_shot" },
            ...prefiledProperties,
            description: {
                translate: "enchantment.enchantplus.accuracy_shot",
                fallback: "Accuracy Shot"
            },
            supportedItems: "#voxel:enchantable/range",
            exclusiveSet: "#enchantplus:exclusive_set/bow",
            tags: [
                "#minecraft:non_treasure",
                "#yggdrasil:structure/alfheim_tree/ominous_vault",
                "#yggdrasil:structure/alfheim_tree/random_loot",
                "#yggdrasil:structure/asflors/common"
            ],
            disabledEffects: ["minecraft:damage"],
            slots: ["mainhand", "offhand"],
            effects: {
                "minecraft:projectile_spawned": [
                    {
                        effect: "minecraft:run_function",
                        function: "enchantplus:actions/accuracy_shot/on_shoot"
                    }
                ],
                "minecraft:damage": [
                    {
                        amount: 1
                    }
                ]
            }
        }
    },
    {
        identifier: "00000000-0000-0000-0000-000000000001",
        data: {
            identifier: { namespace: "enchantplus", registry: "enchantment", resource: "boots/agility" },
            ...prefiledProperties,
            description: {
                translate: "enchantment.enchantplus.agility",
                fallback: "Agility"
            },
            mode: "only_creative",
            supportedItems: "#minecraft:enchantable/foot_armor",
            tags: [
                "#minecraft:non_treasure",
                "#yggdrasil:equipment/item/boots",
                "#yggdrasil:structure/alfheim_tree/random_loot",
                "#yggdrasil:structure/runic_labyrinth/library",
                "#yggdrasil:structure/runic_labyrinth/shulker",
                "#yggdrasil:structure/runic_labyrinth/vault"
            ],
            slots: ["feet"]
        }
    },
    {
        identifier: "00000000-0000-0000-0000-000000000002",
        data: {
            identifier: { namespace: "enchantplus", registry: "enchantment", resource: "elytra/armored" },
            ...prefiledProperties,
            description: {
                translate: "enchantment.enchantplus.armored",
                fallback: "Armored"
            },
            mode: "soft_delete",
            supportedItems: "#voxel:enchantable/elytra",
            tags: [
                "#yggdrasil:structure/alfheim_tree/ominous_vault",
                "#yggdrasil:structure/runic_labyrinth/ominous_vault",
                "#minecraft:double_trade_price",
                "#minecraft:prevents_bee_spawns_when_mining",
                "#minecraft:on_random_loot",
                "#minecraft:on_traded_equipment",
                "#minecraft:tradeable",
                "#minecraft:non_treasure",
                "#minecraft:treasure"
            ],
            slots: ["chest"]
        }
    },
    {
        identifier: "00000000-0000-0000-0000-000000000003",
        data: {
            identifier: { namespace: "enchantplus", registry: "enchantment", resource: "sword/attack_speed" },
            ...prefiledProperties,
            description: {
                translate: "enchantment.enchantplus.attack_speed",
                fallback: "Attack Speed"
            },
            exclusiveSet: "#enchantplus:exclusive_set/sword_attribute",
            supportedItems: "#minecraft:enchantable/sword",
            tags: [
                "#enchantplus:exclusive_set/sword_attribute",
                "#minecraft:non_treasure",
                "#yggdrasil:equipment/item/sword",
                "#yggdrasil:structure/alfheim_tree/random_loot"
            ],
            slots: ["mainhand"]
        }
    },
    {
        identifier: "00000000-0000-0000-0000-000000000004",
        data: {
            identifier: { namespace: "enchantplus", registry: "enchantment", resource: "helmet/auto_feed" },
            ...prefiledProperties,
            description: {
                translate: "enchantment.enchantplus.auto_feed",
                fallback: "Auto Feed"
            },
            supportedItems: "#minecraft:enchantable/head_armor",
            tags: [
                "#minecraft:on_random_loot",
                "#yggdrasil:structure/alfheim_tree/trial_spawner",
                "#yggdrasil:structure/alfheim_tree/vault"
            ],
            slots: ["head"]
        }
    },
    {
        identifier: "00000000-0000-0000-0000-000000000005",
        data: {
            identifier: { namespace: "enchantplus", registry: "enchantment", resource: "tools/auto_smelt" },
            ...prefiledProperties,
            description: {
                translate: "enchantment.enchantplus.auto_smelt",
                fallback: "Auto Smelt"
            },
            supportedItems: "#minecraft:enchantable/mining_loot",
            tags: [
                "#minecraft:non_treasure",
                "#minecraft:on_traded_equipment",
                "#minecraft:tradeable",
                "#yggdrasil:structure/alfheim_tree/trial_spawner",
                "#yggdrasil:structure/alfheim_tree/vault",
                "#yggdrasil:structure/asflors/rare",
                "#yggdrasil:structure/generic/ominous_trial_spawner",
                "#yggdrasil:structure/generic/trial_spawner",
                "#yggdrasil:structure/runic_fracture/trial_spawner"
            ],
            slots: ["mainhand"]
        }
    },
    {
        identifier: "00000000-0000-0000-0000-000000000006",
        data: {
            identifier: { namespace: "enchantplus", registry: "enchantment", resource: "pickaxe/bedrock_breaker" },
            ...prefiledProperties,
            description: {
                translate: "enchantment.enchantplus.bedrock_breaker",
                fallback: "Bedrock Breaker"
            },
            exclusiveSet: "#enchantplus:exclusive_set/mining",
            supportedItems: "#voxel:enchantable/pickaxes",
            tags: [
                "#enchantplus:exclusive_set/mining",
                "#yggdrasil:structure/asflors/rare",
                "#yggdrasil:structure/runic_fracture/trial_spawner"
            ],
            slots: ["mainhand"]
        }
    },
    {
        identifier: "00000000-0000-0000-0000-000000000007",
        data: {
            identifier: { namespace: "enchantplus", registry: "enchantment", resource: "bow/breezing_arrow" },
            ...prefiledProperties,
            description: {
                translate: "enchantment.enchantplus.breezing_arrow",
                fallback: "Breezing Arrows"
            },
            exclusiveSet: "#enchantplus:exclusive_set/bow",
            supportedItems: "#voxel:enchantable/range",
            tags: [
                "#enchantplus:exclusive_set/bow",
                "#yggdrasil:equipment/item/bow",
                "#yggdrasil:structure/alfheim_tree/ominous_trial_spawner",
                "#yggdrasil:structure/alfheim_tree/ominous_vault",
                "#yggdrasil:structure/asflors/common",
                "#yggdrasil:structure/runic_fracture/monster_trial_spawner",
                "#yggdrasil:structure/runic_labyrinth/ominous_vault"
            ],
            slots: ["mainhand", "offhand"]
        }
    },
    {
        identifier: "00000000-0000-0000-0000-000000000008",
        data: {
            identifier: { namespace: "enchantplus", registry: "enchantment", resource: "helmet/bright_vision" },
            ...prefiledProperties,
            description: {
                translate: "enchantment.enchantplus.bright_vision",
                fallback: "Bright Vision"
            },
            supportedItems: "#minecraft:enchantable/head_armor",
            tags: ["#minecraft:non_treasure"],
            slots: ["head"],
            disabledEffects: [],
            mode: "normal"
        }
    },
    {
        identifier: "00000000-0000-0000-0000-000000000009",
        data: {
            identifier: { namespace: "enchantplus", registry: "enchantment", resource: "chestplate/builder_arm" },
            ...prefiledProperties,
            description: {
                translate: "enchantment.enchantplus.builder_arm",
                fallback: "Builder Arm"
            },
            supportedItems: "#minecraft:enchantable/chest_armor",
            tags: [
                "#minecraft:on_random_loot",
                "#minecraft:treasure",
                "#yggdrasil:structure/alfheim_tree/trial_spawner",
                "#yggdrasil:structure/alfheim_tree/vault",
                "#yggdrasil:structure/asflors/common"
            ],
            slots: ["chest"]
        }
    },
    {
        identifier: "00000000-0000-0000-0000-000000000010",
        data: {
            identifier: { namespace: "enchantplus", registry: "enchantment", resource: "durability/curse_of_breaking" },
            ...prefiledProperties,
            description: {
                translate: "enchantment.enchantplus.curse_of_breaking",
                fallback: "Curse of Breaking"
            },
            exclusiveSet: "#enchantplus:exclusive_set/durability",
            supportedItems: "#minecraft:enchantable/durability",
            tags: [
                "#enchantplus:exclusive_set/durability",
                "#minecraft:curse",
                "#minecraft:on_random_loot",
                "#yggdrasil:structure/alfheim_tree/random_loot",
                "#yggdrasil:structure/asflors/common"
            ],
            slots: ["any"]
        }
    },
    {
        identifier: "00000000-0000-0000-0000-000000000011",
        data: {
            identifier: { namespace: "enchantplus", registry: "enchantment", resource: "durability/curse_of_enchant" },
            ...prefiledProperties,
            description: {
                translate: "enchantment.enchantplus.curse_of_enchant",
                fallback: "Curse of Enchant"
            },
            exclusiveSet: "#enchantplus:exclusive_set/durability",
            supportedItems: "#minecraft:enchantable/durability",
            tags: ["#minecraft:curse", "#minecraft:on_random_loot"],
            slots: ["any"]
        }
    },
    {
        identifier: "00000000-0000-0000-0000-000000000012",
        data: {
            identifier: { namespace: "enchantplus", registry: "enchantment", resource: "leggings/dwarfed" },
            ...prefiledProperties,
            description: {
                translate: "enchantment.enchantplus.dwarfed",
                fallback: "Dwarfed"
            },
            exclusiveSet: "#enchantplus:exclusive_set/size",
            supportedItems: "#minecraft:enchantable/leg_armor",
            tags: [
                "#enchantplus:exclusive_set/size",
                "#minecraft:curse",
                "#minecraft:non_treasure",
                "#yggdrasil:equipment/item/leggings",
                "#yggdrasil:structure/runic_labyrinth/ominous_vault",
                "#yggdrasil:structure/runic_labyrinth/vault"
            ],
            slots: ["legs"]
        }
    },
    {
        identifier: "00000000-0000-0000-0000-000000000013",
        data: {
            identifier: { namespace: "enchantplus", registry: "enchantment", resource: "bow/echo_shot" },
            ...prefiledProperties,
            description: {
                translate: "enchantment.enchantplus.echo_shot",
                fallback: "Echo Shot"
            },
            exclusiveSet: "#enchantplus:exclusive_set/bow",
            supportedItems: "#voxel:enchantable/range",
            tags: [
                "#enchantplus:exclusive_set/bow",
                "#minecraft:double_trade_price",
                "#minecraft:on_mob_spawn_equipment",
                "#minecraft:on_random_loot",
                "#minecraft:on_traded_equipment",
                "#minecraft:tradeable",
                "#yggdrasil:equipment/item/bow",
                "#yggdrasil:structure/generic/ominous_trial_spawner",
                "#yggdrasil:structure/runic_labyrinth/library",
                "#yggdrasil:structure/runic_labyrinth/ominous_vault",
                "#yggdrasil:structure/runic_labyrinth/twilight_of_yggdrasil_bow",
                "#yggdrasil:structure/runic_labyrinth/vault"
            ],
            slots: ["mainhand", "offhand"]
        }
    },
    {
        identifier: "00000000-0000-0000-0000-000000000014",
        data: {
            identifier: { namespace: "enchantplus", registry: "enchantment", resource: "bow/eternal_frost" },
            ...prefiledProperties,
            description: {
                translate: "enchantment.enchantplus.eternal_frost",
                fallback: "Eternal Frost"
            },
            exclusiveSet: "#enchantplus:exclusive_set/bow",
            supportedItems: "#voxel:enchantable/range",
            tags: [
                "#enchantplus:exclusive_set/bow",
                "#minecraft:double_trade_price",
                "#minecraft:in_enchanting_table",
                "#minecraft:on_mob_spawn_equipment",
                "#minecraft:on_traded_equipment",
                "#minecraft:tradeable",
                "#yggdrasil:equipment/item/bow",
                "#yggdrasil:structure/alfheim_tree/trial_spawner",
                "#yggdrasil:structure/alfheim_tree/vault",
                "#yggdrasil:structure/asflors/rare",
                "#yggdrasil:structure/runic_fracture/trial_spawner",
                "#yggdrasil:structure/runic_labyrinth/library",
                "#yggdrasil:structure/runic_labyrinth/ominous_vault",
                "#yggdrasil:structure/runic_labyrinth/shulker",
                "#yggdrasil:structure/runic_labyrinth/twilight_of_yggdrasil_bow",
                "#yggdrasil:structure/runic_labyrinth/vault"
            ],
            slots: ["mainhand", "offhand"]
        }
    },
    {
        identifier: "00000000-0000-0000-0000-000000000015",
        data: {
            identifier: { namespace: "enchantplus", registry: "enchantment", resource: "bow/explosive_arrow" },
            ...prefiledProperties,
            description: {
                translate: "enchantment.enchantplus.explosive_arrow",
                fallback: "Explosive Arrow"
            },
            exclusiveSet: "#enchantplus:exclusive_set/bow",
            supportedItems: "#voxel:enchantable/range",
            tags: [
                "#enchantplus:exclusive_set/bow",
                "#minecraft:on_random_loot",
                "#yggdrasil:structure/alfheim_tree/random_loot",
                "#yggdrasil:structure/runic_labyrinth/ominous_vault"
            ],
            slots: ["mainhand", "offhand"]
        }
    },
    {
        identifier: "00000000-0000-0000-0000-000000000016",
        data: {
            identifier: { namespace: "enchantplus", registry: "enchantment", resource: "leggings/fast_swim" },
            ...prefiledProperties,
            description: {
                translate: "enchantment.enchantplus.fast_swim",
                fallback: "Fast Swim"
            },
            supportedItems: "#minecraft:enchantable/leg_armor",
            tags: ["#minecraft:treasure", "#yggdrasil:structure/alfheim_tree/random_loot"],
            slots: ["legs"]
        }
    },
    {
        identifier: "00000000-0000-0000-0000-000000000017",
        data: {
            identifier: { namespace: "enchantplus", registry: "enchantment", resource: "sword/fear" },
            ...prefiledProperties,
            description: {
                translate: "enchantment.enchantplus.fear",
                fallback: "Fear"
            },
            exclusiveSet: "#enchantplus:exclusive_set/sword_effect",
            supportedItems: "#minecraft:enchantable/sword",
            tags: ["#enchantplus:exclusive_set/sword_effect", "#minecraft:non_treasure"],
            slots: ["hand"]
        }
    },
    {
        identifier: "00000000-0000-0000-0000-000000000018",
        data: {
            identifier: { namespace: "enchantplus", registry: "enchantment", resource: "armor/fury" },
            ...prefiledProperties,
            description: {
                translate: "enchantment.enchantplus.fury",
                fallback: "Fury"
            },
            exclusiveSet: "#enchantplus:exclusive_set/armor",
            supportedItems: "#minecraft:enchantable/armor",
            tags: [
                "#enchantplus:exclusive_set/armor",
                "#minecraft:non_treasure",
                "#yggdrasil:equipment/item/chestplate",
                "#yggdrasil:structure/alfheim_tree/random_loot",
                "#yggdrasil:structure/runic_labyrinth/library"
            ],
            slots: ["armor"]
        }
    },
    {
        identifier: "00000000-0000-0000-0000-000000000019",
        data: {
            identifier: { namespace: "enchantplus", registry: "enchantment", resource: "trident/gungnir_breath" },
            ...prefiledProperties,
            description: {
                translate: "enchantment.enchantplus.gungnir_breath",
                fallback: "Gungnir Breath"
            },
            exclusiveSet: "#enchantplus:exclusive_set/trident",
            supportedItems: "#minecraft:enchantable/trident",
            tags: [
                "#enchantplus:exclusive_set/trident",
                "#minecraft:in_enchanting_table",
                "#yggdrasil:equipment/item/sword",
                "#yggdrasil:structure/alfheim_tree/random_loot"
            ],
            slots: ["mainhand", "offhand"]
        }
    },
    {
        identifier: "00000000-0000-0000-0000-000000000020",
        data: {
            identifier: { namespace: "enchantplus", registry: "enchantment", resource: "sword/last_hope" },
            ...prefiledProperties,
            description: {
                translate: "enchantment.enchantplus.last_hope",
                fallback: "Last Hope"
            },
            exclusiveSet: "#enchantplus:exclusive_set/sword_effect",
            supportedItems: "#minecraft:enchantable/sword",
            tags: [
                "#enchantplus:exclusive_set/sword_effect",
                "#yggdrasil:structure/asflors/stand",
                "#yggdrasil:structure/runic_fracture/boss_trial_spawner"
            ],
            slots: ["mainhand"]
        }
    },
    {
        identifier: "00000000-0000-0000-0000-000000000021",
        data: {
            identifier: { namespace: "enchantplus", registry: "enchantment", resource: "boots/lava_walker" },
            ...prefiledProperties,
            description: {
                translate: "enchantment.enchantplus.lava_walker",
                fallback: "Lava Walker"
            },
            exclusiveSet: "#minecraft:exclusive_set/boots",
            supportedItems: "#minecraft:enchantable/foot_armor",
            tags: [
                "#minecraft:exclusive_set/boots",
                "#yggdrasil:structure/alfheim_tree/ominous_vault",
                "#yggdrasil:structure/alfheim_tree/random_loot"
            ],
            slots: ["feet"]
        }
    },
    {
        identifier: "00000000-0000-0000-0000-000000000022",
        data: {
            identifier: { namespace: "enchantplus", registry: "enchantment", resource: "leggings/leaping" },
            ...prefiledProperties,
            description: {
                translate: "enchantment.enchantplus.leaping",
                fallback: "Leaping"
            },
            supportedItems: "#minecraft:enchantable/leg_armor",
            tags: ["#minecraft:non_treasure", "#yggdrasil:structure/alfheim_tree/random_loot"],
            slots: ["legs"]
        }
    },
    {
        identifier: "00000000-0000-0000-0000-000000000023",
        data: {
            identifier: { namespace: "enchantplus", registry: "enchantment", resource: "sword/life_steal" },
            ...prefiledProperties,
            description: {
                translate: "enchantment.enchantplus.life_steal",
                fallback: "Life Steal"
            },
            exclusiveSet: "#enchantplus:exclusive_set/sword_effect",
            supportedItems: "#minecraft:enchantable/weapon",
            primaryItems: "#minecraft:enchantable/sword",
            tags: [
                "#enchantplus:exclusive_set/sword_effect",
                "#minecraft:non_treasure",
                "#yggdrasil:structure/alfheim_tree/random_loot",
                "#yggdrasil:structure/runic_labyrinth/vault"
            ],
            slots: ["mainhand"]
        }
    },
    {
        identifier: "00000000-0000-0000-0000-000000000024",
        data: {
            identifier: { namespace: "enchantplus", registry: "enchantment", resource: "armor/lifeplus" },
            ...prefiledProperties,
            description: {
                translate: "enchantment.enchantplus.lifeplus",
                fallback: "Life+"
            },
            exclusiveSet: "#enchantplus:exclusive_set/armor",
            supportedItems: "#minecraft:enchantable/armor",
            tags: [
                "#enchantplus:exclusive_set/armor",
                "#minecraft:non_treasure",
                "#yggdrasil:equipment/item/chestplate",
                "#yggdrasil:structure/alfheim_tree/random_loot"
            ],
            slots: ["armor"]
        }
    },
    {
        identifier: "00000000-0000-0000-0000-000000000025",
        data: {
            identifier: { namespace: "enchantplus", registry: "enchantment", resource: "tools/miningplus" },
            ...prefiledProperties,
            description: {
                translate: "enchantment.enchantplus.miningplus",
                fallback: "Mining+"
            },
            exclusiveSet: "#enchantplus:exclusive_set/mining",
            supportedItems: "#minecraft:enchantable/mining_loot",
            tags: [
                "#enchantplus:exclusive_set/mining",
                "#minecraft:on_traded_equipment",
                "#minecraft:tradeable",
                "#yggdrasil:structure/alfheim_tree/trial_spawner",
                "#yggdrasil:structure/alfheim_tree/vault"
            ],
            slots: ["mainhand"]
        }
    },
    {
        identifier: "00000000-0000-0000-0000-000000000026",
        data: {
            identifier: { namespace: "enchantplus", registry: "enchantment", resource: "leggings/oversize" },
            ...prefiledProperties,
            description: {
                translate: "enchantment.enchantplus.oversize",
                fallback: "Oversize"
            },
            exclusiveSet: "#enchantplus:exclusive_set/size",
            supportedItems: "#minecraft:enchantable/leg_armor",
            tags: [
                "#enchantplus:exclusive_set/size",
                "#minecraft:curse",
                "#minecraft:on_random_loot",
                "#yggdrasil:equipment/item/leggings",
                "#yggdrasil:structure/alfheim_tree/trial_spawner",
                "#yggdrasil:structure/alfheim_tree/vault",
                "#yggdrasil:structure/asflors/common",
                "#yggdrasil:structure/runic_labyrinth/ominous_vault",
                "#yggdrasil:structure/runic_labyrinth/vault"
            ],
            slots: ["legs"]
        }
    },
    {
        identifier: "00000000-0000-0000-0000-000000000027",
        data: {
            identifier: { namespace: "enchantplus", registry: "enchantment", resource: "sword/poison_aspect" },
            ...prefiledProperties,
            description: {
                translate: "enchantment.enchantplus.poison_aspect",
                fallback: "Poison Aspect"
            },
            exclusiveSet: "#enchantplus:exclusive_set/aspect",
            supportedItems: "#minecraft:enchantable/weapon",
            primaryItems: "#minecraft:enchantable/sword",
            tags: [
                "#enchantplus:exclusive_set/aspect",
                "#minecraft:non_treasure",
                "#yggdrasil:equipment/item/sword",
                "#yggdrasil:structure/alfheim_tree/random_loot"
            ],
            slots: ["mainhand"]
        }
    },
    {
        identifier: "00000000-0000-0000-0000-000000000028",
        data: {
            identifier: { namespace: "enchantplus", registry: "enchantment", resource: "sword/pull" },
            ...prefiledProperties,
            description: {
                translate: "enchantment.enchantplus.pull",
                fallback: "Pull"
            },
            exclusiveSet: "#enchantplus:exclusive_set/sword_effect",
            supportedItems: "#minecraft:enchantable/weapon",
            primaryItems: "#minecraft:enchantable/sword",
            tags: [
                "#enchantplus:exclusive_set/sword_effect",
                "#yggdrasil:structure/alfheim_tree/ominous_trial_spawner",
                "#yggdrasil:structure/generic/ominous_trial_spawner",
                "#yggdrasil:structure/runic_fracture/monster_trial_spawner",
                "#yggdrasil:structure/runic_labyrinth/library",
                "#yggdrasil:structure/runic_labyrinth/ominous_vault",
                "#yggdrasil:structure/runic_labyrinth/shulker",
                "#yggdrasil:structure/runic_labyrinth/vault"
            ],
            slots: ["mainhand"]
        }
    },
    {
        identifier: "00000000-0000-0000-0000-000000000029",
        data: {
            identifier: { namespace: "enchantplus", registry: "enchantment", resource: "sword/reach" },
            ...prefiledProperties,
            description: {
                translate: "enchantment.enchantplus.reach",
                fallback: "Reach"
            },
            exclusiveSet: "#enchantplus:exclusive_set/sword_attribute",
            supportedItems: "#minecraft:enchantable/sword",
            tags: [
                "#enchantplus:exclusive_set/sword_attribute",
                "#minecraft:on_mob_spawn_equipment",
                "#minecraft:on_traded_equipment",
                "#minecraft:tradeable",
                "#yggdrasil:equipment/item/sword",
                "#yggdrasil:structure/alfheim_tree/trial_spawner",
                "#yggdrasil:structure/alfheim_tree/vault"
            ],
            slots: ["mainhand"]
        }
    },
    {
        identifier: "00000000-0000-0000-0000-000000000030",
        data: {
            identifier: { namespace: "enchantplus", registry: "enchantment", resource: "bow/rebound" },
            ...prefiledProperties,
            description: {
                translate: "enchantment.enchantplus.rebound",
                fallback: "Rebound"
            },
            supportedItems: "#voxel:enchantable/range",
            tags: [
                "#enchantplus:exclusive_set/archery",
                "#minecraft:on_mob_spawn_equipment",
                "#yggdrasil:equipment/item/bow",
                "#yggdrasil:structure/generic/ominous_trial_spawner",
                "#yggdrasil:structure/runic_labyrinth/dark_elven_bow",
                "#yggdrasil:structure/runic_labyrinth/library",
                "#yggdrasil:structure/runic_labyrinth/ominous_vault",
                "#yggdrasil:structure/runic_labyrinth/shulker",
                "#yggdrasil:structure/runic_labyrinth/twilight_of_yggdrasil_bow",
                "#yggdrasil:structure/runic_labyrinth/vault"
            ],
            slots: ["mainhand", "offhand"]
        }
    },
    {
        identifier: "00000000-0000-0000-0000-000000000031",
        data: {
            identifier: { namespace: "enchantplus", registry: "enchantment", resource: "hoe/scyther" },
            ...prefiledProperties,
            description: {
                translate: "enchantment.enchantplus.scyther",
                fallback: "Scyther"
            },
            supportedItems: "#voxel:enchantable/hoes",
            tags: ["#minecraft:non_treasure", "#yggdrasil:structure/alfheim_tree/trial_spawner", "#yggdrasil:structure/alfheim_tree/vault"],
            slots: ["mainhand"]
        }
    },
    {
        identifier: "00000000-0000-0000-0000-000000000032",
        data: {
            identifier: { namespace: "enchantplus", registry: "enchantment", resource: "boots/sky_walk" },
            ...prefiledProperties,
            description: {
                translate: "enchantment.enchantplus.disable_for_1.21.2",
                fallback: "Sky Walk (Disable for 1.21.2)"
            },
            exclusiveSet: "#minecraft:exclusive_set/boots",
            supportedItems: "#minecraft:enchantable/foot_armor",
            tags: [
                "#minecraft:exclusive_set/boots",
                "#minecraft:non_treasure",
                "#yggdrasil:equipment/item/boots",
                "#yggdrasil:structure/alfheim_tree/trial_spawner",
                "#yggdrasil:structure/alfheim_tree/vault",
                "#yggdrasil:structure/runic_labyrinth/library"
            ],
            slots: ["feet"]
        }
    },
    {
        identifier: "00000000-0000-0000-0000-000000000033",
        data: {
            identifier: { namespace: "enchantplus", registry: "enchantment", resource: "pickaxe/spawner_touch" },
            ...prefiledProperties,
            description: {
                translate: "enchantment.enchantplus.spawner_touch",
                fallback: "Spawner Touch"
            },
            exclusiveSet: "#enchantplus:exclusive_set/mining",
            supportedItems: "#voxel:enchantable/pickaxes",
            tags: [
                "#enchantplus:exclusive_set/mining",
                "#yggdrasil:structure/alfheim_tree/ominous_trial_spawner",
                "#yggdrasil:structure/generic/ominous_trial_spawner",
                "#yggdrasil:structure/runic_fracture/monster_trial_spawner",
                "#yggdrasil:structure/runic_labyrinth/library",
                "#yggdrasil:structure/runic_labyrinth/ominous_vault",
                "#yggdrasil:structure/runic_labyrinth/shulker",
                "#yggdrasil:structure/runic_labyrinth/vault"
            ],
            slots: ["mainhand"]
        }
    },
    {
        identifier: "00000000-0000-0000-0000-000000000034",
        data: {
            identifier: { namespace: "enchantplus", registry: "enchantment", resource: "boots/step_assist" },
            ...prefiledProperties,
            description: {
                translate: "enchantment.enchantplus.step_assist",
                fallback: "Step Assist"
            },
            exclusiveSet: "#minecraft:exclusive_set/boots",
            supportedItems: "#minecraft:enchantable/foot_armor",
            tags: [
                "#minecraft:exclusive_set/boots",
                "#yggdrasil:equipment/item/boots",
                "#yggdrasil:structure/alfheim_tree/ominous_vault",
                "#yggdrasil:structure/alfheim_tree/random_loot",
                "#yggdrasil:structure/generic/trial_spawner",
                "#yggdrasil:structure/runic_labyrinth/library",
                "#yggdrasil:structure/runic_labyrinth/shulker",
                "#yggdrasil:structure/runic_labyrinth/vault"
            ],
            slots: ["feet"]
        }
    },
    {
        identifier: "00000000-0000-0000-0000-000000000035",
        data: {
            identifier: { namespace: "enchantplus", registry: "enchantment", resource: "bow/storm_arrow" },
            ...prefiledProperties,
            description: {
                translate: "enchantment.enchantplus.storm_arrow",
                fallback: "Storm Arrows"
            },
            exclusiveSet: "#enchantplus:exclusive_set/bow",
            supportedItems: "#voxel:enchantable/range",
            tags: ["#enchantplus:exclusive_set/bow", "#yggdrasil:equipment/item/bow", "#yggdrasil:structure/runic_labyrinth/ominous_vault"],
            slots: ["mainhand", "offhand"]
        }
    },
    {
        identifier: "00000000-0000-0000-0000-000000000036",
        data: {
            identifier: { namespace: "enchantplus", registry: "enchantment", resource: "mace/striker" },
            ...prefiledProperties,
            description: {
                translate: "enchantment.minecraft.striker",
                fallback: "Striker"
            },
            supportedItems: "#minecraft:enchantable/mace",
            tags: [
                "#minecraft:on_traded_equipment",
                "#yggdrasil:structure/alfheim_tree/trial_spawner",
                "#yggdrasil:structure/alfheim_tree/vault",
                "#yggdrasil:structure/asflors/rare",
                "#yggdrasil:structure/generic/trial_spawner",
                "#yggdrasil:structure/runic_fracture/trial_spawner",
                "#yggdrasil:structure/runic_labyrinth/library",
                "#yggdrasil:structure/runic_labyrinth/ominous_vault",
                "#yggdrasil:structure/runic_labyrinth/shulker",
                "#yggdrasil:structure/runic_labyrinth/vault"
            ],
            slots: ["mainhand"]
        }
    },
    {
        identifier: "00000000-0000-0000-0000-000000000037",
        data: {
            identifier: { namespace: "enchantplus", registry: "enchantment", resource: "sword/tears_of_asflors" },
            ...prefiledProperties,
            description: {
                translate: "enchantment.enchantplus.tears_of_asflors",
                fallback: "Tears of Asflors",
                color: "#ffcbfc"
            },
            exclusiveSet: "#enchantplus:exclusive_set/sword_effect",
            supportedItems: "#minecraft:enchantable/sword",
            tags: [
                "#enchantplus:exclusive_set/sword_effect",
                "#yggdrasil:structure/asflors/asflors_sword",
                "#yggdrasil:structure/asflors/ominous_vault",
                "#yggdrasil:structure/asflors/vault"
            ],
            slots: ["mainhand"]
        }
    },
    {
        identifier: "00000000-0000-0000-0000-000000000038",
        data: {
            identifier: { namespace: "enchantplus", registry: "enchantment", resource: "mace/teluric_wave" },
            ...prefiledProperties,
            description: {
                translate: "enchantment.enchantplus.teluric_wave",
                fallback: "Teluric Wave"
            },
            exclusiveSet: "#enchantplus:exclusive_set/mace",
            supportedItems: "#minecraft:enchantable/mace",
            tags: [
                "#enchantplus:exclusive_set/mace",
                "#yggdrasil:structure/generic/ominous_trial_spawner",
                "#yggdrasil:structure/generic/trial_spawner",
                "#yggdrasil:structure/runic_labyrinth/library"
            ],
            slots: ["mainhand"]
        }
    },

    {
        identifier: "00000000-0000-0000-0000-000000000039",
        data: {
            identifier: { namespace: "enchantplus", registry: "enchantment", resource: "axe/timber" },
            ...prefiledProperties,
            description: {
                translate: "enchantment.enchantplus.timber",
                fallback: "Timber"
            },
            supportedItems: "#voxel:enchantable/axes",
            tags: [
                "#minecraft:non_treasure",
                "#yggdrasil:structure/alfheim_tree/trial_spawner",
                "#yggdrasil:structure/alfheim_tree/vault",
                "#yggdrasil:structure/runic_labyrinth/library",
                "#yggdrasil:structure/runic_labyrinth/ominous_vault",
                "#yggdrasil:structure/runic_labyrinth/shulker",
                "#yggdrasil:structure/runic_labyrinth/vault"
            ],
            slots: ["mainhand"]
        }
    },
    {
        identifier: "00000000-0000-0000-0000-000000000040",
        data: {
            identifier: { namespace: "enchantplus", registry: "enchantment", resource: "pickaxe/vein_miner" },
            ...prefiledProperties,
            description: {
                translate: "enchantment.enchantplus.vein_miner",
                fallback: "Vein Miner"
            },
            exclusiveSet: "#enchantplus:exclusive_set/mining",
            supportedItems: "#voxel:enchantable/pickaxes",
            tags: [
                "#enchantplus:exclusive_set/mining",
                "#minecraft:double_trade_price",
                "#minecraft:on_traded_equipment",
                "#minecraft:tradeable",
                "#yggdrasil:structure/alfheim_tree/trial_spawner",
                "#yggdrasil:structure/alfheim_tree/vault",
                "#yggdrasil:structure/generic/ominous_trial_spawner",
                "#yggdrasil:structure/runic_labyrinth/library",
                "#yggdrasil:structure/runic_labyrinth/ominous_vault",
                "#yggdrasil:structure/runic_labyrinth/shulker",
                "#yggdrasil:structure/runic_labyrinth/vault"
            ],
            slots: ["mainhand"]
        }
    },
    {
        identifier: "00000000-0000-0000-0000-000000000041",
        data: {
            identifier: { namespace: "enchantplus", registry: "enchantment", resource: "armor/venom_protection" },
            ...prefiledProperties,
            description: {
                translate: "enchantment.enchantplus.venom_protection",
                fallback: "Venom Protection"
            },
            exclusiveSet: "#minecraft:exclusive_set/armor",
            supportedItems: "#minecraft:enchantable/armor",
            tags: [
                "#minecraft:exclusive_set/armor",
                "#minecraft:treasure",
                "#yggdrasil:structure/alfheim_tree/random_loot",
                "#yggdrasil:structure/runic_labyrinth/library"
            ],
            slots: ["armor"]
        }
    },

    {
        identifier: "00000000-0000-0000-0000-000000000042",
        data: {
            identifier: { namespace: "enchantplus", registry: "enchantment", resource: "helmet/voidless" },
            ...prefiledProperties,
            description: {
                translate: "enchantment.enchantplus.voidless",
                fallback: "Voidless"
            },
            supportedItems: "#minecraft:enchantable/head_armor",
            tags: ["#yggdrasil:structure/alfheim_tree/ominous_vault", "#yggdrasil:structure/runic_labyrinth/ominous_vault"],
            slots: ["head"]
        }
    },
    {
        identifier: "00000000-0000-0000-0000-000000000043",
        data: {
            identifier: { namespace: "enchantplus", registry: "enchantment", resource: "mace/wind_propulsion" },
            ...prefiledProperties,
            description: {
                translate: "enchantment.minecraft.wind_propulsion",
                fallback: "Wind Propulsion"
            },
            supportedItems: "#minecraft:enchantable/mace",
            tags: ["#minecraft:non_treasure", "#yggdrasil:structure/alfheim_tree/trial_spawner", "#yggdrasil:structure/alfheim_tree/vault"],
            slots: ["mainhand"]
        }
    },
    {
        identifier: "00000000-0000-0000-0000-000000000044",
        data: {
            identifier: { namespace: "enchantplus", registry: "enchantment", resource: "sword/xp_boost" },
            ...prefiledProperties,
            description: {
                translate: "enchantment.enchantplus.xp_boost",
                fallback: "Xp Boost"
            },
            exclusiveSet: "#enchantplus:exclusive_set/sword_exp",
            supportedItems: "#minecraft:enchantable/sword",
            tags: [
                "#enchantplus:exclusive_set/sword_exp",
                "#minecraft:non_treasure",
                "#yggdrasil:structure/alfheim_tree/trial_spawner",
                "#yggdrasil:structure/alfheim_tree/vault",
                "#yggdrasil:structure/generic/trial_spawner",
                "#yggdrasil:structure/runic_labyrinth/library"
            ],
            slots: ["mainhand"]
        }
    }
];
