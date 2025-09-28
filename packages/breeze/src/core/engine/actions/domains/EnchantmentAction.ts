import { getManager } from "@/core/engine/Manager";
import { isArraySlotRegistryType, isSlotRegistryType, type SlotRegistryType } from "@/core/engine/managers/SlotManager";
import type { EnchantmentProps } from "@/core/schema/enchant/types";
import { defineActionDomain, type ActionJsonFromClasses } from "@/core/engine/actions/domain";
import { getFieldValue, getValueAtPath, setValueAtPath } from "@/core/engine/actions/utils";
import { EngineAction, type ActionExecutionContext } from "@/core/engine/actions/EngineAction";

abstract class EnchantmentEngineAction<TPayload extends Record<string, unknown>> extends EngineAction<TPayload> {
	protected clone(element: Record<string, unknown>): EnchantmentProps {
		return structuredClone(element) as EnchantmentProps;
	}
}

type SetComputedSlotPayload = { path: string; slot: SlotRegistryType | unknown };

export class SetComputedSlotAction extends EnchantmentEngineAction<SetComputedSlotPayload> {
	static create(path: string, slot: SlotRegistryType | unknown): SetComputedSlotAction {
		return new SetComputedSlotAction({ path, slot });
	}

	protected apply(element: Record<string, unknown>, context: ActionExecutionContext): Record<string, unknown> {
		const version = context.version;
		if (!version) {
			throw new Error("Version is required for computed slot actions");
		}

		const slotManager = getManager("slot", version);
		if (!slotManager) {
			throw new Error(`SlotManager is not available for version ${version}`);
		}

		const computedValue = getFieldValue(this.payload.slot);
		if (typeof computedValue !== "string" || !isSlotRegistryType(computedValue)) {
			throw new Error(`Invalid SlotRegistryType: ${String(computedValue)}`);
		}

		const currentRaw = getValueAtPath(element, this.payload.path);
		if (
			!Array.isArray(currentRaw) ||
			!currentRaw.every((value) => typeof value === "string") ||
			!isArraySlotRegistryType(currentRaw as string[])
		) {
			throw new Error(`Invalid SlotRegistryType array: ${JSON.stringify(currentRaw)}`);
		}

		const nextSlots = slotManager.apply(currentRaw as SlotRegistryType[], computedValue);
		return setValueAtPath(element, this.payload.path, nextSlots);
	}
}

type ToggleExclusivePayload = { enchantment: string };

export class ToggleEnchantmentToExclusiveSetAction extends EnchantmentEngineAction<ToggleExclusivePayload> {
	static create(enchantment: string): ToggleEnchantmentToExclusiveSetAction {
		return new ToggleEnchantmentToExclusiveSetAction({ enchantment });
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const props = this.clone(element);
		const enchantment = this.payload.enchantment;

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

type SetExclusivePayload = { value: string };

export class SetExclusiveSetWithTagsAction extends EnchantmentEngineAction<SetExclusivePayload> {
	static create(value: string): SetExclusiveSetWithTagsAction {
		return new SetExclusiveSetWithTagsAction({ value });
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const props = this.clone(element);
		if (props.exclusiveSet === this.payload.value) {
			props.exclusiveSet = undefined;
			return props;
		}

		props.exclusiveSet = this.payload.value;
		return props;
	}
}

const ENCHANTMENT_ACTION_DOMAIN = defineActionDomain("enchantment", [
	[
		"setComputedSlot",
		"set_computed_slot",
		SetComputedSlotAction,
		(path: string, slot: SlotRegistryType | unknown) => SetComputedSlotAction.create(path, slot)
	],
	[
		"toggleEnchantmentToExclusiveSet",
		"toggle_enchantment_to_exclusive_set",
		ToggleEnchantmentToExclusiveSetAction,
		(enchantment: string) => ToggleEnchantmentToExclusiveSetAction.create(enchantment)
	],
	[
		"setExclusiveSetWithTags",
		"set_exclusive_set_with_tags",
		SetExclusiveSetWithTagsAction,
		(value: string) => SetExclusiveSetWithTagsAction.create(value)
	]
] as const);

export const ENCHANTMENT_ACTION_CLASSES = ENCHANTMENT_ACTION_DOMAIN.classes;
export const EnchantmentActions = ENCHANTMENT_ACTION_DOMAIN.builders;

export type EnchantmentAction = ActionJsonFromClasses<typeof ENCHANTMENT_ACTION_CLASSES>;
