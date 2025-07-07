import type { SlotRegistryType } from "@/core/engine/managers/SlotManager";
import type { EnchantmentAction } from "../domains/enchantment/types";
import { ActionBuilder } from "./ActionBuilder";

export class EnchantmentActionBuilder extends ActionBuilder<EnchantmentAction> {
	setComputedSlot(path: string, slot: SlotRegistryType): SetComputedSlotBuilder {
		return new SetComputedSlotBuilder(path, slot);
	}

	toggleEnchantmentToExclusiveSet(enchantment: string): ToggleEnchantmentToExclusiveSetBuilder {
		return new ToggleEnchantmentToExclusiveSetBuilder(enchantment);
	}

	setExclusiveSetWithTags(value: string): SetExclusiveSetWithTagsBuilder {
		return new SetExclusiveSetWithTagsBuilder(value);
	}

	build(): EnchantmentAction {
		throw new Error("Use specific builder methods to create actions");
	}
}

class SetComputedSlotBuilder extends ActionBuilder<Extract<EnchantmentAction, { type: "enchantment.set_computed_slot" }>> {
	constructor(
		private path: string,
		private slot: SlotRegistryType
	) {
		super();
	}

	build() {
		return {
			type: "enchantment.set_computed_slot" as const,
			path: this.path,
			slot: this.slot
		};
	}
}

class ToggleEnchantmentToExclusiveSetBuilder extends ActionBuilder<
	Extract<EnchantmentAction, { type: "enchantment.toggle_enchantment_to_exclusive_set" }>
> {
	constructor(private enchantment: string) {
		super();
	}

	build() {
		return {
			type: "enchantment.toggle_enchantment_to_exclusive_set" as const,
			enchantment: this.enchantment
		};
	}
}

class SetExclusiveSetWithTagsBuilder extends ActionBuilder<
	Extract<EnchantmentAction, { type: "enchantment.set_exclusive_set_with_tags" }>
> {
	constructor(private value: string) {
		super();
	}

	build() {
		return {
			type: "enchantment.set_exclusive_set_with_tags" as const,
			value: this.value
		};
	}
}
