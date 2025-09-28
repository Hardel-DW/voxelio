import { getManager } from "@/core/engine/Manager";
import { isArraySlotRegistryType, isSlotRegistryType, type SlotRegistryType } from "@/core/engine/managers/SlotManager";
import type { EnchantmentProps } from "@/core/schema/enchant/types";
import type { ActionJsonFromClasses } from "@/core/engine/actions/domain";
import { getFieldValue, getValueAtPath, setValueAtPath } from "@/core/engine/actions/utils";
import { EngineAction, type ActionExecutionContext } from "@/core/engine/actions/EngineAction";

abstract class EnchantmentEngineAction<TPayload extends Record<string, unknown>> extends EngineAction<TPayload> {
	protected clone(element: Record<string, unknown>): EnchantmentProps {
		return structuredClone(element) as EnchantmentProps;
	}
}

type SetComputedSlotPayload = { path: string; slot: SlotRegistryType | unknown };

export class SetComputedSlotAction extends EnchantmentEngineAction<SetComputedSlotPayload> {
	static readonly type = "enchantment.set_computed_slot" as const;
	readonly type = SetComputedSlotAction.type;

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
	static readonly type = "enchantment.toggle_enchantment_to_exclusive_set" as const;
	readonly type = ToggleEnchantmentToExclusiveSetAction.type;

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
	static readonly type = "enchantment.set_exclusive_set_with_tags" as const;
	readonly type = SetExclusiveSetWithTagsAction.type;

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

export const ENCHANTMENT_ACTION_CLASSES = [
	SetComputedSlotAction,
	ToggleEnchantmentToExclusiveSetAction,
	SetExclusiveSetWithTagsAction
] as const;

export type EnchantmentAction = ActionJsonFromClasses<typeof ENCHANTMENT_ACTION_CLASSES>;

export const EnchantmentActions = {
	setComputedSlot: (path: string, slot: SlotRegistryType | unknown) => SetComputedSlotAction.create(path, slot),
	toggleEnchantmentToExclusiveSet: (enchantment: string) => ToggleEnchantmentToExclusiveSetAction.create(enchantment),
	setExclusiveSetWithTags: (value: string) => SetExclusiveSetWithTagsAction.create(value)
};
