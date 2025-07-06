import type { DataDrivenElement } from "@/core/Element";
import type { SingleOrMultiple } from "@/index";
import type { TextComponentType } from "@/schema/TextComponentType";

const SlotManager = ["any", "mainhand", "offhand", "hand", "head", "chest", "legs", "feet", "armor", "body", "saddle"] as const;
export type SlotRegistryType = (typeof SlotManager)[number];
export interface Enchantment extends DataDrivenElement {
    description: TextComponentType;
    exclusive_set?: SingleOrMultiple<string>;
    supported_items: SingleOrMultiple<string>;
    primary_items?: SingleOrMultiple<string>;
    weight: number;
    max_level: number;
    min_cost: EnchantmentCost;
    max_cost: EnchantmentCost;
    anvil_cost: number;
    slots: SlotRegistryType[];
    effects?: Record<string, any>;
}

export interface EnchantmentCost {
    base: number;
    per_level_above_first: number;
}
