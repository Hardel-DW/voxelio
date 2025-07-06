import { type SlotRegistryType, toggleSlot } from "@/core/engine/managers/SlotManager";

type ManagerTypes = {
    slot: {
        apply: (existingSlots: SlotRegistryType[], slotToToggle: SlotRegistryType) => SlotRegistryType[];
    };
};

const managers: {
    [K in ManagerKeys]: {
        min: number;
        max: number;
        func: ManagerTypes[K]["apply"];
    }[];
} = {
    slot: [{ min: 48, max: Number.POSITIVE_INFINITY, func: toggleSlot }]
};

type ManagerKeys = keyof ManagerTypes;
export function getManager<T extends ManagerKeys>(managerType: T, version: number): ManagerTypes[T] | undefined {
    const managerList = managers[managerType];
    if (!managerList || managerList.length === 0) return undefined;

    for (const manager of managerList) {
        if (version >= manager.min && version <= manager.max) {
            return { apply: manager.func } as ManagerTypes[T];
        }
    }

    return undefined;
}
