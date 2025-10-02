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
} as const;

export type SlotMappings = typeof SLOT_MAPPINGS;
export type SlotRegistryType = keyof SlotMappings;

const SLOT_MAPPINGS_BY_VERSION: Record<number, SlotMappings> = {
	48: SLOT_MAPPINGS
};

export class SlotManager {
	private slots: Set<SlotRegistryType>;
	private mappings: SlotMappings;
	private compositeSlots: [SlotRegistryType, readonly SlotRegistryType[]][];

	constructor(slots: SlotRegistryType[], mappings: SlotMappings = SLOT_MAPPINGS) {
		this.slots = new Set(slots);
		this.mappings = mappings;
		this.compositeSlots = Object.entries(this.mappings)
			.filter(([, children]) => children.length > 1)
			.toSorted(([, a], [, b]) => b.length - a.length) as [SlotRegistryType, readonly SlotRegistryType[]][];
	}

	static fromVersion(version: number, slots: SlotRegistryType[]): SlotManager {
		return new SlotManager(slots, SLOT_MAPPINGS_BY_VERSION[version] ?? SLOT_MAPPINGS);
	}

	static isSlotRegistryType(value: string, mappings: SlotMappings = SLOT_MAPPINGS): value is SlotRegistryType {
		return Object.keys(mappings).includes(value as SlotRegistryType);
	}

	static isArraySlotRegistryType(value: string[], mappings: SlotMappings = SLOT_MAPPINGS): value is SlotRegistryType[] {
		return value.every((v) => SlotManager.isSlotRegistryType(v, mappings));
	}

	add(slot: SlotRegistryType): this {
		this.slots.add(slot);
		this.normalize();
		return this;
	}

	remove(slot: SlotRegistryType): this {
		const expanded = new Set<SlotRegistryType>();

		for (const s of this.slots) {
			const children = this.mappings[s];
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
		const flattened = new Set(Array.from(currentSlots).flatMap((slot) => this.mappings[slot]));

		for (const [composite, children] of this.compositeSlots) {
			const childrenSet = new Set(children);
			if (flattened.size === childrenSet.size && Array.from(flattened).every((s) => childrenSet.has(s))) {
				this.slots = new Set([composite]);
				return this;
			}
		}

		for (const [composite, children] of this.compositeSlots) {
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
		return this.slots.has(slot) || Array.from(this.slots).some((s) => this.mappings[s].includes(slot as never));
	}

	flatten(): SlotRegistryType[] {
		return Array.from(new Set(Array.from(this.slots).flatMap((slot) => this.mappings[slot])));
	}

	toArray(): SlotRegistryType[] {
		return Array.from(this.slots);
	}
}
