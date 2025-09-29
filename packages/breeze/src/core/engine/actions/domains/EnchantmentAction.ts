import { getManager } from "@/core/engine/Manager";
import { isArraySlotRegistryType, isSlotRegistryType, type SlotRegistryType } from "@/core/engine/managers/SlotManager";
import type { EnchantmentProps } from "@/core/schema/enchant/types";
import { getFieldValue, getValueAtPath, setValueAtPath } from "@/core/engine/actions/utils";
import { Action } from "@/core/engine/actions/Action";

export class SetComputedSlotAction extends Action<{ path: string; slot: SlotRegistryType | unknown }> {
	readonly type = "enchantment.set_computed_slot" as const;

	apply(element: Record<string, unknown>, version?: number): Record<string, unknown> {
		if (!version) {
			throw new Error("Version is required for computed slot actions");
		}

		const slotManager = getManager("slot", version);
		if (!slotManager) {
			throw new Error(`SlotManager is not available for version ${version}`);
		}

		const computedValue = getFieldValue(this.params.slot);
		if (typeof computedValue !== "string" || !isSlotRegistryType(computedValue)) {
			throw new Error(`Invalid SlotRegistryType: ${String(computedValue)}`);
		}

		const currentRaw = getValueAtPath(element, this.params.path);
		if (
			!Array.isArray(currentRaw) ||
			!currentRaw.every((value) => typeof value === "string") ||
			!isArraySlotRegistryType(currentRaw as string[])
		) {
			throw new Error(`Invalid SlotRegistryType array: ${JSON.stringify(currentRaw)}`);
		}

		const nextSlots = slotManager.apply(currentRaw as SlotRegistryType[], computedValue);
		return setValueAtPath(element, this.params.path, nextSlots);
	}
}

export class ToggleEnchantmentToExclusiveSetAction extends Action<{ enchantment: string }> {
	readonly type = "enchantment.toggle_enchantment_to_exclusive_set" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const props = structuredClone(element) as EnchantmentProps;
		const enchantment = this.params.enchantment;

		if (typeof props.exclusiveSet === "string") {
			if (props.exclusiveSet.startsWith("#")) {
				props.exclusiveSet = [enchantment];
			} else if (props.exclusiveSet === enchantment) {
				props.exclusiveSet = undefined;
			} else {
				props.exclusiveSet = [props.exclusiveSet, enchantment];
			}
		}

		const current = Array.isArray(props.exclusiveSet) ? props.exclusiveSet : [];
		const exists = current.includes(enchantment);
		props.exclusiveSet = exists ? current.filter((value) => value !== enchantment) : [...current, enchantment];
		return props;
	}
}

export class SetExclusiveSetWithTagsAction extends Action<{ value: string }> {
	readonly type = "enchantment.set_exclusive_set_with_tags" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const props = structuredClone(element) as EnchantmentProps;
		if (props.exclusiveSet === this.params.value) {
			props.exclusiveSet = undefined;
			return props;
		}

		props.exclusiveSet = this.params.value;
		return props;
	}
}

// Liste des classes d'actions Enchantment - ajouter ici pour créer une nouvelle action
export const ENCHANTMENT_ACTION_CLASSES = [
	SetComputedSlotAction,
	ToggleEnchantmentToExclusiveSetAction,
	SetExclusiveSetWithTagsAction
] as const;
