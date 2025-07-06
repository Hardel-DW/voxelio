import type { VoxelElement } from "@/core/Element";
import { Identifier } from "@/core/Identifier";
import type { SlotRegistryType } from "@/core/engine/managers/SlotManager";
import type { SingleOrMultiple } from "@/index";
import type { TextComponentType } from "@/schema/TextComponentType";

const tags_related_to_functionality = [
    { namespace: "minecraft", registry: "tags/enchantment", resource: "curse" },
    { namespace: "minecraft", registry: "tags/enchantment", resource: "double_trade_price" },
    { namespace: "minecraft", registry: "tags/enchantment", resource: "prevents_bee_spawns_when_mining" },
    { namespace: "minecraft", registry: "tags/enchantment", resource: "prevents_decorated_pot_shattering" },
    { namespace: "minecraft", registry: "tags/enchantment", resource: "prevents_ice_melting" },
    { namespace: "minecraft", registry: "tags/enchantment", resource: "prevents_infested_spawns" },
    { namespace: "minecraft", registry: "tags/enchantment", resource: "smelts_loot" },
    { namespace: "minecraft", registry: "tags/enchantment", resource: "tooltip_order" }
];

export const FUNCTIONALITY_TAGS_CACHE = new Set(tags_related_to_functionality.map((tag) => new Identifier(tag).toString()));
export interface EnchantmentProps extends VoxelElement {
    description: TextComponentType;
    exclusiveSet: SingleOrMultiple<string> | undefined;
    supportedItems: SingleOrMultiple<string>;
    primaryItems: SingleOrMultiple<string> | undefined;
    maxLevel: number;
    weight: number;
    anvilCost: number;
    minCostBase: number;
    minCostPerLevelAboveFirst: number;
    maxCostBase: number;
    maxCostPerLevelAboveFirst: number;
    effects: Record<string, unknown> | undefined;
    slots: SlotRegistryType[];
    tags: string[];
    mode: "normal" | "soft_delete" | "only_creative";
    disabledEffects: string[];
    unknownFields?: Record<string, any>;
}

/**
 * Known Enchantment fields according to Minecraft specification.
 */
export const KNOWN_ENCHANTMENT_FIELDS = new Set([
    "description",
    "exclusive_set",
    "supported_items",
    "primary_items",
    "max_level",
    "weight",
    "anvil_cost",
    "min_cost",
    "max_cost",
    "effects",
    "slots"
]);
