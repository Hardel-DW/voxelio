export type SlotRegistryType = (typeof SlotManager)[number];

const SlotManager = ["any", "mainhand", "offhand", "hand", "head", "chest", "legs", "feet", "armor", "body", "saddle"] as const;

export const SLOT_MAPPINGS = {
    any: ["mainhand", "offhand", "head", "chest", "legs", "feet"],
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

export function addSlot(existingSlots: SlotRegistryType[], newSlot: SlotRegistryType): SlotRegistryType[] {
    if (newSlot === "any") return ["any"];
    let updatedSlots = [...new Set([...existingSlots, newSlot])];

    const armorSlots = SLOT_MAPPINGS.armor as SlotRegistryType[];
    if (armorSlots.every((slot) => updatedSlots.includes(slot))) {
        updatedSlots = updatedSlots.filter((slot) => !armorSlots.includes(slot));
        updatedSlots.push("armor");
    }

    const handSlots = SLOT_MAPPINGS.hand as SlotRegistryType[];
    if (handSlots.every((slot) => updatedSlots.includes(slot))) {
        updatedSlots = updatedSlots.filter((slot) => !handSlots.includes(slot));
        updatedSlots.push("hand");
    }

    const everySlot = ["hand", "armor"] as SlotRegistryType[];
    if (everySlot.every((slot) => updatedSlots.includes(slot))) return ["any"];
    if (updatedSlots.includes("any")) return ["any"];

    return updatedSlots;
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
