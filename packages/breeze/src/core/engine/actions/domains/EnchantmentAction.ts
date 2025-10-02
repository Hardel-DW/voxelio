import { SlotManager, type SlotRegistryType } from "@/core/SlotManager";
import type { EnchantmentProps } from "@/core/schema/enchant/types";
import { getFieldValue, getValueAtPath, setValueAtPath } from "@/core/engine/actions/utils";
import { Action } from "@/core/engine/actions/index";

export class EnchantmentAction<P = any> extends Action<P> {
	constructor(
		params: P,
		private applyFn: (element: Record<string, unknown>, params: P, version?: number) => Record<string, unknown>
	) {
		super(params);
	}

	apply(element: Record<string, unknown>, version?: number): Record<string, unknown> {
		return this.applyFn(element, this.params, version);
	}

	static setComputedSlot(path: string, slot: SlotRegistryType | unknown) {
		return new EnchantmentAction({ path, slot }, (el, p: { path: string; slot: SlotRegistryType | unknown }, version) => {
			if (!version) {
				throw new Error("Version is required for computed slot actions");
			}

			const computedValue = getFieldValue(p.slot);
			if (typeof computedValue !== "string" || !SlotManager.isSlotRegistryType(computedValue)) {
				throw new Error(`Invalid SlotRegistryType: ${String(computedValue)}`);
			}

			const currentRaw = getValueAtPath(el, p.path);
			if (
				!Array.isArray(currentRaw) ||
				!currentRaw.every((value) => typeof value === "string") ||
				!SlotManager.isArraySlotRegistryType(currentRaw as string[])
			) {
				throw new Error(`Invalid SlotRegistryType array: ${JSON.stringify(currentRaw)}`);
			}

			const nextSlots = SlotManager.fromVersion(version, currentRaw as SlotRegistryType[])
				.toggle(computedValue)
				.toArray();
			return setValueAtPath(el, p.path, nextSlots);
		});
	}

	static toggleEnchantmentToExclusiveSet(enchantment: string) {
		return new EnchantmentAction({ enchantment }, (el, p: { enchantment: string }) => {
			const props = structuredClone(el) as EnchantmentProps;

			if (typeof props.exclusiveSet === "string") {
				if (props.exclusiveSet.startsWith("#")) {
					props.exclusiveSet = [p.enchantment];
				} else if (props.exclusiveSet === p.enchantment) {
					props.exclusiveSet = undefined;
				} else {
					props.exclusiveSet = [props.exclusiveSet, p.enchantment];
				}
			}

			const current = Array.isArray(props.exclusiveSet) ? props.exclusiveSet : [];
			const exists = current.includes(p.enchantment);
			props.exclusiveSet = exists ? current.filter((value) => value !== p.enchantment) : [...current, p.enchantment];
			return props;
		});
	}

	static setExclusiveSetWithTags(value: string) {
		return new EnchantmentAction({ value }, (el, p: { value: string }) => {
			const props = structuredClone(el) as EnchantmentProps;
			if (props.exclusiveSet === p.value) {
				props.exclusiveSet = undefined;
				return props;
			}

			props.exclusiveSet = p.value;
			return props;
		});
	}
}
