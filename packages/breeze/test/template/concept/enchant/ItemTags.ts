import type { DataDrivenRegistryElement } from "@/core/Element";
import type { TagType } from "@/schema/TagType";

export const itemTags: DataDrivenRegistryElement<TagType>[] = [
    {
        identifier: { namespace: "minecraft", registry: "tags/item", resource: "enchantable/sword" },
        data: {
            values: [
                "minecraft:wooden_sword",
                "minecraft:stone_sword",
                "minecraft:iron_sword",
                "minecraft:diamond_sword",
                "minecraft:netherite_sword",
                "minecraft:golden_sword"
            ]
        }
    },
    {
        identifier: { namespace: "minecraft", registry: "tags/item", resource: "enchantable/sharp_weapon" },
        data: {
            values: [
                "#minecraft:enchantable/sword",
                "minecraft:trident"
            ]
        }
    },
    {
        identifier: { namespace: "minecraft", registry: "tags/item", resource: "enchantable/weapon" },
        data: {
            values: [
                "#minecraft:enchantable/sword",
                "minecraft:trident",
                "minecraft:mace"
            ]
        }
    },
    {
        identifier: { namespace: "minecraft", registry: "tags/item", resource: "enchantable/fire_aspect" },
        data: {
            values: [
                "#minecraft:enchantable/sword"
            ]
        }
    },
    {
        identifier: { namespace: "minecraft", registry: "tags/item", resource: "enchantable/bow" },
        data: {
            values: [
                "minecraft:bow"
            ]
        }
    },
    {
        identifier: { namespace: "minecraft", registry: "tags/item", resource: "enchantable/crossbow" },
        data: {
            values: [
                "minecraft:crossbow"
            ]
        }
    },
    {
        identifier: { namespace: "minecraft", registry: "tags/item", resource: "enchantable/trident" },
        data: {
            values: [
                "minecraft:trident"
            ]
        }
    },
    {
        identifier: { namespace: "minecraft", registry: "tags/item", resource: "enchantable/mace" },
        data: {
            values: [
                "minecraft:mace"
            ]
        }
    },
    {
        identifier: { namespace: "minecraft", registry: "tags/item", resource: "enchantable/mining" },
        data: {
            values: [
                "minecraft:wooden_pickaxe",
                "minecraft:stone_pickaxe",
                "minecraft:iron_pickaxe",
                "minecraft:diamond_pickaxe",
                "minecraft:netherite_pickaxe",
                "minecraft:golden_pickaxe",
                "minecraft:wooden_axe",
                "minecraft:stone_axe",
                "minecraft:iron_axe",
                "minecraft:diamond_axe",
                "minecraft:netherite_axe",
                "minecraft:golden_axe",
                "minecraft:wooden_shovel",
                "minecraft:stone_shovel",
                "minecraft:iron_shovel",
                "minecraft:diamond_shovel",
                "minecraft:netherite_shovel",
                "minecraft:golden_shovel",
                "minecraft:wooden_hoe",
                "minecraft:stone_hoe",
                "minecraft:iron_hoe",
                "minecraft:diamond_hoe",
                "minecraft:netherite_hoe",
                "minecraft:golden_hoe"
            ]
        }
    },
    {
        identifier: { namespace: "minecraft", registry: "tags/item", resource: "enchantable/mining_loot" },
        data: {
            values: [
                "#minecraft:enchantable/mining"
            ]
        }
    },
    {
        identifier: { namespace: "minecraft", registry: "tags/item", resource: "enchantable/armor" },
        data: {
            values: [
                "#minecraft:enchantable/head_armor",
                "#minecraft:enchantable/chest_armor",
                "#minecraft:enchantable/leg_armor",
                "#minecraft:enchantable/foot_armor"
            ]
        }
    },
    {
        identifier: { namespace: "minecraft", registry: "tags/item", resource: "enchantable/head_armor" },
        data: {
            values: [
                "minecraft:leather_helmet",
                "minecraft:chainmail_helmet",
                "minecraft:iron_helmet",
                "minecraft:diamond_helmet",
                "minecraft:netherite_helmet",
                "minecraft:golden_helmet",
                "minecraft:turtle_helmet"
            ]
        }
    },
    {
        identifier: { namespace: "minecraft", registry: "tags/item", resource: "enchantable/chest_armor" },
        data: {
            values: [
                "minecraft:leather_chestplate",
                "minecraft:chainmail_chestplate",
                "minecraft:iron_chestplate",
                "minecraft:diamond_chestplate",
                "minecraft:netherite_chestplate",
                "minecraft:golden_chestplate"
            ]
        }
    },
    {
        identifier: { namespace: "minecraft", registry: "tags/item", resource: "enchantable/leg_armor" },
        data: {
            values: [
                "minecraft:leather_leggings",
                "minecraft:chainmail_leggings",
                "minecraft:iron_leggings",
                "minecraft:diamond_leggings",
                "minecraft:netherite_leggings",
                "minecraft:golden_leggings"
            ]
        }
    },
    {
        identifier: { namespace: "minecraft", registry: "tags/item", resource: "enchantable/foot_armor" },
        data: {
            values: [
                "minecraft:leather_boots",
                "minecraft:chainmail_boots",
                "minecraft:iron_boots",
                "minecraft:diamond_boots",
                "minecraft:netherite_boots",
                "minecraft:golden_boots"
            ]
        }
    },
    {
        identifier: { namespace: "minecraft", registry: "tags/item", resource: "enchantable/durability" },
        data: {
            values: [
                "#minecraft:enchantable/armor",
                "#minecraft:enchantable/weapon",
                "#minecraft:enchantable/mining",
                "#minecraft:enchantable/bow",
                "#minecraft:enchantable/crossbow",
                "#minecraft:enchantable/trident",
                "minecraft:fishing_rod",
                "minecraft:carrot_on_a_stick",
                "minecraft:warped_fungus_on_a_stick",
                "minecraft:flint_and_steel",
                "minecraft:shears",
                "minecraft:elytra"
            ]
        }
    },
    {
        identifier: { namespace: "minecraft", registry: "tags/item", resource: "enchantable/fishing" },
        data: {
            values: [
                "minecraft:fishing_rod"
            ]
        }
    },
    {
        identifier: { namespace: "minecraft", registry: "tags/item", resource: "enchantable/equippable" },
        data: {
            values: [
                "#minecraft:enchantable/armor",
                "minecraft:elytra",
                "minecraft:carved_pumpkin",
                "minecraft:mob_head"
            ]
        }
    },
    {
        identifier: { namespace: "minecraft", registry: "tags/item", resource: "enchantable/vanishing" },
        data: {
            values: [
                "#minecraft:enchantable/durability"
            ]
        }
    }
];