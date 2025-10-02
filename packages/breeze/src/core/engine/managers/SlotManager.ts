const SLOT_MAPPINGS = {
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
} as const;

export type SlotRegistryType = keyof typeof SLOT_MAPPINGS;
export { SLOT_MAPPINGS };

export class SlotManager {
	private slots: Set<SlotRegistryType>;
	private static readonly allSlots = Object.keys(SLOT_MAPPINGS) as SlotRegistryType[];
	private static readonly compositeSlots = Object.entries(SLOT_MAPPINGS)
		.filter(([, children]) => children.length > 1)
		.toSorted(([, a], [, b]) => b.length - a.length) as [SlotRegistryType, readonly SlotRegistryType[]][];

	constructor(slots: SlotRegistryType[]) {
		this.slots = new Set(slots);
	}

	static isSlotRegistryType(value: string): value is SlotRegistryType {
		return SlotManager.allSlots.includes(value as SlotRegistryType);
	}

	static isArraySlotRegistryType(value: string[]): value is SlotRegistryType[] {
		return value.every(SlotManager.isSlotRegistryType);
	}

	add(slot: SlotRegistryType): this {
		this.slots.add(slot);
		this.normalize();
		return this;
	}

	remove(slot: SlotRegistryType): this {
		const expanded = new Set<SlotRegistryType>();

		for (const s of this.slots) {
			const children = SLOT_MAPPINGS[s];
			if (children.includes(slot as never)) {
				for (const child of children) {
					child !== slot && expanded.add(child);
				}
			} else {
				expanded.add(s);
			}
		}

		this.slots = expanded;
		this.normalize();
		return this;
	}

	toggle(slot: SlotRegistryType): this {
		return this.has(slot) ? this.remove(slot) : this.add(slot);
	}

	normalize(): this {
		const currentSlots = new Set(this.slots);
		const flattened = new Set(Array.from(currentSlots).flatMap((slot) => SLOT_MAPPINGS[slot]));

		for (const [composite, children] of SlotManager.compositeSlots) {
			const childrenSet = new Set(children);
			if (flattened.size === childrenSet.size && Array.from(flattened).every((s) => childrenSet.has(s))) {
				this.slots = new Set([composite]);
				return this;
			}
		}

		// Group individual slots into composites
		for (const [composite, children] of SlotManager.compositeSlots) {
			if (children.every((child) => currentSlots.has(child))) {
				for (const child of children) {
					currentSlots.delete(child);
				}
				currentSlots.add(composite);
			}
		}

		this.slots = currentSlots;
		return this;
	}

	has(slot: SlotRegistryType): boolean {
		return this.slots.has(slot) || Array.from(this.slots).some((s) => SLOT_MAPPINGS[s].includes(slot as never));
	}

	flatten(): SlotRegistryType[] {
		return Array.from(new Set(Array.from(this.slots).flatMap((slot) => SLOT_MAPPINGS[slot])));
	}

	toArray(): SlotRegistryType[] {
		return Array.from(this.slots);
	}
}