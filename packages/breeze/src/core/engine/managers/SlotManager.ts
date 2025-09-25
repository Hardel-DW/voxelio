export type SlotRegistryType = (typeof SlotManager)[number];

const SlotManager = ["any", "mainhand", "offhand", "hand", "head", "chest", "legs", "feet", "armor", "body", "saddle"] as const;

export const SLOT_MAPPINGS = {
	any: ["mainhand", "offhand", "head", "chest", "legs", "feet", "body", "saddle"],
	armor: ["head", "chest", "legs", "feet"],
	hand: ["mainhand", "offhand"],
	mainhand: ["mainhand"],
	offhand: ["offhand"],
	head: ["head"],
	chest: ["chest"],
	legs: ["legs"],
	feet: ["feet"],
	body: ["body"],
	saddle: ["saddle"]
};

export function isSlotRegistryType(value: string): value is SlotRegistryType {
	return SlotManager.includes(value as SlotRegistryType);
}

export function isArraySlotRegistryType(value: string[]): value is SlotRegistryType[] {
	return value.every(isSlotRegistryType);
}

export function normalizeSlots(slots: SlotRegistryType[]): SlotRegistryType[] {
	if (slots.includes("any")) return ["any"];
	let normalizedSlots = [...new Set(slots)];

	const armorSlots = SLOT_MAPPINGS.armor as SlotRegistryType[];
	if (armorSlots.every((slot) => normalizedSlots.includes(slot))) {
		normalizedSlots = normalizedSlots.filter((slot) => !armorSlots.includes(slot));
		normalizedSlots.push("armor");
	}

	const handSlots = SLOT_MAPPINGS.hand as SlotRegistryType[];
	if (handSlots.every((slot) => normalizedSlots.includes(slot))) {
		normalizedSlots = normalizedSlots.filter((slot) => !handSlots.includes(slot));
		normalizedSlots.push("hand");
	}

	const allIndividualSlots = ["mainhand", "offhand", "head", "chest", "legs", "feet", "body", "saddle"] as SlotRegistryType[];
	if (allIndividualSlots.every((slot) => normalizedSlots.includes(slot))) return ["any"];

	const everyGroupSlot = ["hand", "armor", "body", "saddle"] as SlotRegistryType[];
	if (everyGroupSlot.every((slot) => normalizedSlots.includes(slot))) return ["any"];

	return normalizedSlots;
}

export function addSlot(existingSlots: SlotRegistryType[], newSlot: SlotRegistryType): SlotRegistryType[] {
	if (newSlot === "any") return ["any"];
	const updatedSlots = [...existingSlots, newSlot];
	return normalizeSlots(updatedSlots);
}

export function removeSlot(existingSlots: SlotRegistryType[], slotToRemove: SlotRegistryType): SlotRegistryType[] {
	if (existingSlots.length === 0) {
		return [];
	}

	const result: Set<SlotRegistryType> = new Set();

	for (const slot of existingSlots) {
		if (slot === "any") {
			if (slotToRemove === "mainhand" || slotToRemove === "offhand") {
				result.add("armor");
				result.add(slotToRemove === "mainhand" ? "offhand" : "mainhand");
			} else if (SLOT_MAPPINGS.armor.includes(slotToRemove as SlotRegistryType)) {
				result.add("hand");
				for (const s of SLOT_MAPPINGS.armor) {
					if (s !== slotToRemove) result.add(s as SlotRegistryType);
				}
			} else {
				result.add("hand");
				result.add("armor");
			}
		} else if (slot === "armor" && SLOT_MAPPINGS.armor.includes(slotToRemove as SlotRegistryType)) {
			for (const s of SLOT_MAPPINGS.armor) {
				if (s !== slotToRemove) result.add(s as SlotRegistryType);
			}
		} else if (slot === "hand" && SLOT_MAPPINGS.hand.includes(slotToRemove as SlotRegistryType)) {
			for (const s of SLOT_MAPPINGS.hand) {
				if (s !== slotToRemove) result.add(s as SlotRegistryType);
			}
		} else if (slot !== slotToRemove) {
			result.add(slot);
		}
	}

	return Array.from(result);
}

export function toggleSlot(existingSlots: SlotRegistryType[], slotToToggle: SlotRegistryType): SlotRegistryType[] {
	const keyExistInParams = existingSlots.includes(slotToToggle);
	const keyExistInHand = existingSlots.includes("hand") && SLOT_MAPPINGS.hand.includes(slotToToggle);
	const keyExistInArmor = existingSlots.includes("armor") && SLOT_MAPPINGS.armor.includes(slotToToggle);
	const keyExistInAny = existingSlots.includes("any") && SLOT_MAPPINGS.any.includes(slotToToggle);

	return keyExistInParams || keyExistInHand || keyExistInArmor || keyExistInAny
		? removeSlot(existingSlots, slotToToggle)
		: addSlot(existingSlots, slotToToggle);
}

export const flattenSlots = (slots: SlotRegistryType[]): SlotRegistryType[] =>
	Array.from(new Set(slots.flatMap((slot) => SLOT_MAPPINGS[slot] as SlotRegistryType[])));
