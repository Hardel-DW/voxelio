import type { LootGroup, LootItem, LootTableProps } from "@/core/schema/loot/types";
import type { Action } from "@/core/engine/actions/types";
import {
	EngineAction,
	extractPayload,
	type ActionExecutionContext,
	type ActionLike,
	isEngineAction
} from "@/core/engine/actions/EngineAction";

abstract class LootTableEngineAction<TPayload extends Record<string, unknown>> extends EngineAction<TPayload> {
	protected clone(element: Record<string, unknown>): LootTableProps {
		return structuredClone(element) as LootTableProps;
	}
}

let globalItemCounter = 0;
let globalGroupCounter = 0;

type AddLootItemPayload = {
	poolIndex: number;
	item: {
		name: string;
		weight?: number;
		quality?: number;
		conditions?: string[];
		functions?: string[];
	};
};

export class AddLootItemAction extends LootTableEngineAction<AddLootItemPayload> {
	static readonly type = "loot_table.add_loot_item" as const;
	readonly type = AddLootItemAction.type;

	static create(payload: AddLootItemPayload): AddLootItemAction {
		return new AddLootItemAction(payload);
	}

	static fromJSON(action: Action): AddLootItemAction {
		if (action.type !== AddLootItemAction.type) {
			throw new Error(`Invalid action type '${action.type}' for AddLootItemAction`);
		}
		return new AddLootItemAction(extractPayload(action) as AddLootItemPayload);
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const lootTable = this.clone(element);
		const item: LootItem = {
			id: `item_${globalItemCounter++}`,
			name: this.payload.item.name,
			weight: this.payload.item.weight,
			quality: this.payload.item.quality,
			conditions: this.payload.item.conditions || [],
			functions: this.payload.item.functions || [],
			poolIndex: this.payload.poolIndex,
			entryIndex: 0,
			entryType: "minecraft:item"
		};

		lootTable.items.push(item);
		return lootTable;
	}
}

type RemoveLootItemPayload = { itemId: string };

export class RemoveLootItemAction extends LootTableEngineAction<RemoveLootItemPayload> {
	static readonly type = "loot_table.remove_loot_item" as const;
	readonly type = RemoveLootItemAction.type;

	static create(itemId: string): RemoveLootItemAction {
		return new RemoveLootItemAction({ itemId });
	}

	static fromJSON(action: Action): RemoveLootItemAction {
		if (action.type !== RemoveLootItemAction.type) {
			throw new Error(`Invalid action type '${action.type}' for RemoveLootItemAction`);
		}
		return new RemoveLootItemAction(extractPayload(action) as RemoveLootItemPayload);
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const lootTable = this.clone(element);
		lootTable.items = lootTable.items.filter((item) => item.id !== this.payload.itemId);
		for (const group of lootTable.groups) {
			group.items = group.items.filter((itemId) => itemId !== this.payload.itemId);
		}
		lootTable.groups = lootTable.groups.filter((group) => group.items.length > 0);
		return lootTable;
	}
}

type ModifyLootItemPayload = { itemId: string; property: "name" | "weight" | "quality"; value: unknown };

export class ModifyLootItemAction extends LootTableEngineAction<ModifyLootItemPayload> {
	static readonly type = "loot_table.modify_loot_item" as const;
	readonly type = ModifyLootItemAction.type;

	static create(payload: ModifyLootItemPayload): ModifyLootItemAction {
		return new ModifyLootItemAction(payload);
	}

	static fromJSON(action: Action): ModifyLootItemAction {
		if (action.type !== ModifyLootItemAction.type) {
			throw new Error(`Invalid action type '${action.type}' for ModifyLootItemAction`);
		}
		return new ModifyLootItemAction(extractPayload(action) as ModifyLootItemPayload);
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const lootTable = this.clone(element);
		const item = lootTable.items.find((candidate) => candidate.id === this.payload.itemId);
		if (item) {
			switch (this.payload.property) {
				case "name":
					item.name = this.payload.value as string;
					break;
				case "weight":
					item.weight = this.payload.value as number;
					break;
				case "quality":
					item.quality = this.payload.value as number;
					break;
			}
		}
		return lootTable;
	}
}

type DuplicateLootItemPayload = { itemId: string; targetPoolIndex?: number };

export class DuplicateLootItemAction extends LootTableEngineAction<DuplicateLootItemPayload> {
	static readonly type = "loot_table.duplicate_loot_item" as const;
	readonly type = DuplicateLootItemAction.type;

	static create(itemId: string, targetPoolIndex?: number): DuplicateLootItemAction {
		return new DuplicateLootItemAction({ itemId, targetPoolIndex });
	}

	static fromJSON(action: Action): DuplicateLootItemAction {
		if (action.type !== DuplicateLootItemAction.type) {
			throw new Error(`Invalid action type '${action.type}' for DuplicateLootItemAction`);
		}
		return new DuplicateLootItemAction(extractPayload(action) as DuplicateLootItemPayload);
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const lootTable = this.clone(element);
		const source = lootTable.items.find((candidate) => candidate.id === this.payload.itemId);
		if (source) {
			const duplicate: LootItem = {
				...source,
				id: `item_${globalItemCounter++}`,
				poolIndex: this.payload.targetPoolIndex ?? source.poolIndex
			};
			lootTable.items.push(duplicate);
		}
		return lootTable;
	}
}

type BulkModifyItemsPayload = {
	itemIds: string[];
	property: "weight" | "quality";
	operation: "multiply" | "add" | "set";
	value: number;
};

export class BulkModifyItemsAction extends LootTableEngineAction<BulkModifyItemsPayload> {
	static readonly type = "loot_table.bulk_modify_items" as const;
	readonly type = BulkModifyItemsAction.type;

	static create(payload: BulkModifyItemsPayload): BulkModifyItemsAction {
		return new BulkModifyItemsAction(payload);
	}

	static fromJSON(action: Action): BulkModifyItemsAction {
		if (action.type !== BulkModifyItemsAction.type) {
			throw new Error(`Invalid action type '${action.type}' for BulkModifyItemsAction`);
		}
		return new BulkModifyItemsAction(extractPayload(action) as BulkModifyItemsPayload);
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const lootTable = this.clone(element);
		for (const itemId of this.payload.itemIds) {
			const item = lootTable.items.find((candidate) => candidate.id === itemId);
			if (!item) continue;

			const current = (this.payload.property === "weight" ? item.weight : item.quality) ?? 0;
			let next = current;
			switch (this.payload.operation) {
				case "multiply":
					next = current * this.payload.value;
					break;
				case "add":
					next = current + this.payload.value;
					break;
				case "set":
					next = this.payload.value;
					break;
			}
			if (this.payload.property === "weight") item.weight = next;
			else item.quality = next;
		}
		return lootTable;
	}
}

type CreateLootGroupPayload = {
	groupType: "alternatives" | "group" | "sequence";
	itemIds: string[];
	poolIndex: number;
	entryIndex?: number;
};

export class CreateLootGroupAction extends LootTableEngineAction<CreateLootGroupPayload> {
	static readonly type = "loot_table.create_loot_group" as const;
	readonly type = CreateLootGroupAction.type;

	static create(payload: CreateLootGroupPayload): CreateLootGroupAction {
		return new CreateLootGroupAction(payload);
	}

	static fromJSON(action: Action): CreateLootGroupAction {
		if (action.type !== CreateLootGroupAction.type) {
			throw new Error(`Invalid action type '${action.type}' for CreateLootGroupAction`);
		}
		return new CreateLootGroupAction(extractPayload(action) as CreateLootGroupPayload);
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const lootTable = this.clone(element);
		const group: LootGroup = {
			id: `group_${globalGroupCounter++}`,
			type: this.payload.groupType,
			items: [...this.payload.itemIds],
			poolIndex: this.payload.poolIndex,
			entryIndex: this.payload.entryIndex ?? 0
		};
		lootTable.groups.push(group);
		return lootTable;
	}
}

type ModifyLootGroupPayload = {
	groupId: string;
	operation: "add_item" | "remove_item" | "change_type";
	value: unknown;
};

export class ModifyLootGroupAction extends LootTableEngineAction<ModifyLootGroupPayload> {
	static readonly type = "loot_table.modify_loot_group" as const;
	readonly type = ModifyLootGroupAction.type;

	static create(payload: ModifyLootGroupPayload): ModifyLootGroupAction {
		return new ModifyLootGroupAction(payload);
	}

	static fromJSON(action: Action): ModifyLootGroupAction {
		if (action.type !== ModifyLootGroupAction.type) {
			throw new Error(`Invalid action type '${action.type}' for ModifyLootGroupAction`);
		}
		return new ModifyLootGroupAction(extractPayload(action) as ModifyLootGroupPayload);
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const lootTable = this.clone(element);
		const group = lootTable.groups.find((candidate) => candidate.id === this.payload.groupId);
		if (!group) return lootTable;

		switch (this.payload.operation) {
			case "add_item": {
				const value = this.payload.value as string;
				if (!group.items.includes(value)) group.items.push(value);
				break;
			}
			case "remove_item": {
				const value = this.payload.value as string;
				group.items = group.items.filter((itemId) => itemId !== value);
				break;
			}
			case "change_type":
				group.type = this.payload.value as LootGroup["type"];
				break;
		}
		return lootTable;
	}
}

type DissolveLootGroupPayload = { groupId: string };

export class DissolveLootGroupAction extends LootTableEngineAction<DissolveLootGroupPayload> {
	static readonly type = "loot_table.dissolve_loot_group" as const;
	readonly type = DissolveLootGroupAction.type;

	static create(groupId: string): DissolveLootGroupAction {
		return new DissolveLootGroupAction({ groupId });
	}

	static fromJSON(action: Action): DissolveLootGroupAction {
		if (action.type !== DissolveLootGroupAction.type) {
			throw new Error(`Invalid action type '${action.type}' for DissolveLootGroupAction`);
		}
		return new DissolveLootGroupAction(extractPayload(action) as DissolveLootGroupPayload);
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const lootTable = this.clone(element);
		lootTable.groups = lootTable.groups.filter((group) => group.id !== this.payload.groupId);
		for (const group of lootTable.groups) {
			group.items = group.items.filter((itemId) => itemId !== this.payload.groupId);
		}
		return lootTable;
	}
}

type ConvertItemToGroupPayload = {
	itemId: string;
	groupType: "alternatives" | "group" | "sequence";
	additionalItems?: string[];
};

export class ConvertItemToGroupAction extends LootTableEngineAction<ConvertItemToGroupPayload> {
	static readonly type = "loot_table.convert_item_to_group" as const;
	readonly type = ConvertItemToGroupAction.type;

	static create(payload: ConvertItemToGroupPayload): ConvertItemToGroupAction {
		return new ConvertItemToGroupAction(payload);
	}

	static fromJSON(action: Action): ConvertItemToGroupAction {
		if (action.type !== ConvertItemToGroupAction.type) {
			throw new Error(`Invalid action type '${action.type}' for ConvertItemToGroupAction`);
		}
		return new ConvertItemToGroupAction(extractPayload(action) as ConvertItemToGroupPayload);
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const lootTable = this.clone(element);
		const item = lootTable.items.find((candidate) => candidate.id === this.payload.itemId);
		if (item) {
			const group: LootGroup = {
				id: `group_${globalGroupCounter++}`,
				type: this.payload.groupType,
				items: [this.payload.itemId, ...(this.payload.additionalItems ?? [])],
				poolIndex: item.poolIndex,
				entryIndex: item.entryIndex
			};
			lootTable.groups.push(group);
		}
		return lootTable;
	}
}

type ConvertGroupToItemPayload = { groupId: string; keepFirstItem?: boolean };

export class ConvertGroupToItemAction extends LootTableEngineAction<ConvertGroupToItemPayload> {
	static readonly type = "loot_table.convert_group_to_item" as const;
	readonly type = ConvertGroupToItemAction.type;

	static create(groupId: string, keepFirstItem?: boolean): ConvertGroupToItemAction {
		return new ConvertGroupToItemAction({ groupId, keepFirstItem });
	}

	static fromJSON(action: Action): ConvertGroupToItemAction {
		if (action.type !== ConvertGroupToItemAction.type) {
			throw new Error(`Invalid action type '${action.type}' for ConvertGroupToItemAction`);
		}
		return new ConvertGroupToItemAction(extractPayload(action) as ConvertGroupToItemPayload);
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const lootTable = this.clone(element);
		const group = lootTable.groups.find((candidate) => candidate.id === this.payload.groupId);
		if (!group || group.items.length === 0) return lootTable;

		if (this.payload.keepFirstItem) {
			lootTable.groups = lootTable.groups.filter((g) => g.id !== this.payload.groupId);
			for (const remaining of lootTable.groups) {
				remaining.items = remaining.items.filter((itemId) => itemId !== this.payload.groupId);
			}
		} else {
			for (const itemId of group.items) {
				lootTable.items = lootTable.items.filter((item) => item.id !== itemId);
			}
			lootTable.groups = lootTable.groups.filter((g) => g.id !== this.payload.groupId);
		}
		return lootTable;
	}
}

type NestGroupInGroupPayload = { childGroupId: string; parentGroupId: string; position?: number };

export class NestGroupInGroupAction extends LootTableEngineAction<NestGroupInGroupPayload> {
	static readonly type = "loot_table.nest_group_in_group" as const;
	readonly type = NestGroupInGroupAction.type;

	static create(payload: NestGroupInGroupPayload): NestGroupInGroupAction {
		return new NestGroupInGroupAction(payload);
	}

	static fromJSON(action: Action): NestGroupInGroupAction {
		if (action.type !== NestGroupInGroupAction.type) {
			throw new Error(`Invalid action type '${action.type}' for NestGroupInGroupAction`);
		}
		return new NestGroupInGroupAction(extractPayload(action) as NestGroupInGroupPayload);
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const lootTable = this.clone(element);
		const parent = lootTable.groups.find((candidate) => candidate.id === this.payload.parentGroupId);
		if (parent) {
			const insertionIndex = this.payload.position ?? parent.items.length;
			parent.items.splice(insertionIndex, 0, this.payload.childGroupId);
		}
		return lootTable;
	}
}

type UnnestGroupPayload = { groupId: string };

export class UnnestGroupAction extends LootTableEngineAction<UnnestGroupPayload> {
	static readonly type = "loot_table.unnest_group" as const;
	readonly type = UnnestGroupAction.type;

	static create(groupId: string): UnnestGroupAction {
		return new UnnestGroupAction({ groupId });
	}

	static fromJSON(action: Action): UnnestGroupAction {
		if (action.type !== UnnestGroupAction.type) {
			throw new Error(`Invalid action type '${action.type}' for UnnestGroupAction`);
		}
		return new UnnestGroupAction(extractPayload(action) as UnnestGroupPayload);
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const lootTable = this.clone(element);
		for (const group of lootTable.groups) {
			group.items = group.items.filter((itemId) => itemId !== this.payload.groupId);
		}
		return lootTable;
	}
}

type MoveItemBetweenPoolsPayload = { itemId: string; targetPoolIndex: number };

export class MoveItemBetweenPoolsAction extends LootTableEngineAction<MoveItemBetweenPoolsPayload> {
	static readonly type = "loot_table.move_item_between_pools" as const;
	readonly type = MoveItemBetweenPoolsAction.type;

	static create(itemId: string, targetPoolIndex: number): MoveItemBetweenPoolsAction {
		return new MoveItemBetweenPoolsAction({ itemId, targetPoolIndex });
	}

	static fromJSON(action: Action): MoveItemBetweenPoolsAction {
		if (action.type !== MoveItemBetweenPoolsAction.type) {
			throw new Error(`Invalid action type '${action.type}' for MoveItemBetweenPoolsAction`);
		}
		return new MoveItemBetweenPoolsAction(extractPayload(action) as MoveItemBetweenPoolsPayload);
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const lootTable = this.clone(element);
		const item = lootTable.items.find((candidate) => candidate.id === this.payload.itemId);
		if (item) {
			item.poolIndex = this.payload.targetPoolIndex;
		}
		return lootTable;
	}
}

type MoveGroupBetweenPoolsPayload = { groupId: string; targetPoolIndex: number };

export class MoveGroupBetweenPoolsAction extends LootTableEngineAction<MoveGroupBetweenPoolsPayload> {
	static readonly type = "loot_table.move_group_between_pools" as const;
	readonly type = MoveGroupBetweenPoolsAction.type;

	static create(groupId: string, targetPoolIndex: number): MoveGroupBetweenPoolsAction {
		return new MoveGroupBetweenPoolsAction({ groupId, targetPoolIndex });
	}

	static fromJSON(action: Action): MoveGroupBetweenPoolsAction {
		if (action.type !== MoveGroupBetweenPoolsAction.type) {
			throw new Error(`Invalid action type '${action.type}' for MoveGroupBetweenPoolsAction`);
		}
		return new MoveGroupBetweenPoolsAction(extractPayload(action) as MoveGroupBetweenPoolsPayload);
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const lootTable = this.clone(element);
		const group = lootTable.groups.find((candidate) => candidate.id === this.payload.groupId);
		if (group) {
			group.poolIndex = this.payload.targetPoolIndex;
		}
		return lootTable;
	}
}

type BalanceWeightsPayload = { poolIndex: number; targetTotal?: number };

export class BalanceWeightsAction extends LootTableEngineAction<BalanceWeightsPayload> {
	static readonly type = "loot_table.balance_weights" as const;
	readonly type = BalanceWeightsAction.type;

	static create(poolIndex: number, targetTotal?: number): BalanceWeightsAction {
		return new BalanceWeightsAction({ poolIndex, targetTotal });
	}

	static fromJSON(action: Action): BalanceWeightsAction {
		if (action.type !== BalanceWeightsAction.type) {
			throw new Error(`Invalid action type '${action.type}' for BalanceWeightsAction`);
		}
		return new BalanceWeightsAction(extractPayload(action) as BalanceWeightsPayload);
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const lootTable = this.clone(element);
		const poolItems = lootTable.items.filter((item) => item.poolIndex === this.payload.poolIndex);
		const targetTotal = this.payload.targetTotal ?? 100;
		if (poolItems.length > 0) {
			const weightPerItem = Math.floor(targetTotal / poolItems.length);
			for (const item of poolItems) {
				item.weight = weightPerItem;
			}
		}
		return lootTable;
	}
}

type ConditionalLootPayload = {
	condition: {
		type: "pool_empty" | "item_count" | "group_exists";
		poolIndex?: number;
		itemId?: string;
		groupId?: string;
		count?: number;
	};
	thenAction: ActionLike | undefined;
	elseAction?: ActionLike;
};

export class ConditionalLootAction extends LootTableEngineAction<ConditionalLootPayload> {
	static readonly type = "loot_table.conditional_loot" as const;
	readonly type = ConditionalLootAction.type;

	static create(payload: ConditionalLootPayload): ConditionalLootAction {
		return new ConditionalLootAction(payload);
	}

	static fromJSON(action: Action): ConditionalLootAction {
		if (action.type !== ConditionalLootAction.type) {
			throw new Error(`Invalid action type '${action.type}' for ConditionalLootAction`);
		}
		return new ConditionalLootAction(extractPayload(action) as ConditionalLootPayload);
	}

	protected async apply(element: Record<string, unknown>, context: ActionExecutionContext): Promise<Record<string, unknown>> {
		const lootTable = this.clone(element);
		let conditionMet = false;
		const { condition } = this.payload;

		switch (condition.type) {
			case "pool_empty":
				if (condition.poolIndex !== undefined) {
					const poolItems = lootTable.items.filter((item) => item.poolIndex === condition.poolIndex);
					conditionMet = poolItems.length === 0;
				}
				break;
			case "item_count":
				conditionMet = lootTable.items.length >= (condition.count ?? 0);
				break;
			case "group_exists":
				conditionMet = lootTable.groups.some((group) => group.id === condition.groupId);
				break;
		}

		const nextAction = conditionMet ? this.payload.thenAction : this.payload.elseAction;
		if (nextAction) {
			const result = await context.invoke(nextAction, lootTable);
			if (result) return result as LootTableProps;
		}

		return lootTable;
	}
}

export const LOOT_TABLE_ACTION_CLASSES = [
	AddLootItemAction,
	RemoveLootItemAction,
	ModifyLootItemAction,
	DuplicateLootItemAction,
	BulkModifyItemsAction,
	CreateLootGroupAction,
	ModifyLootGroupAction,
	DissolveLootGroupAction,
	ConvertItemToGroupAction,
	ConvertGroupToItemAction,
	NestGroupInGroupAction,
	UnnestGroupAction,
	MoveItemBetweenPoolsAction,
	MoveGroupBetweenPoolsAction,
	BalanceWeightsAction,
	ConditionalLootAction
] as const;

export type LootTableActionInstance = InstanceType<(typeof LOOT_TABLE_ACTION_CLASSES)[number]>;

export const LootTableActions = {
	addLootItem: (payload: AddLootItemPayload) => AddLootItemAction.create(payload),
	removeLootItem: (itemId: string) => RemoveLootItemAction.create(itemId),
	modifyLootItem: (payload: ModifyLootItemPayload) => ModifyLootItemAction.create(payload),
	duplicateLootItem: (itemId: string, targetPoolIndex?: number) => DuplicateLootItemAction.create(itemId, targetPoolIndex),
	bulkModifyItems: (payload: BulkModifyItemsPayload) => BulkModifyItemsAction.create(payload),
	createLootGroup: (payload: CreateLootGroupPayload) => CreateLootGroupAction.create(payload),
	modifyLootGroup: (payload: ModifyLootGroupPayload) => ModifyLootGroupAction.create(payload),
	dissolveLootGroup: (groupId: string) => DissolveLootGroupAction.create(groupId),
	convertItemToGroup: (payload: ConvertItemToGroupPayload) => ConvertItemToGroupAction.create(payload),
	convertGroupToItem: (groupId: string, keepFirstItem?: boolean) => ConvertGroupToItemAction.create(groupId, keepFirstItem),
	nestGroupInGroup: (payload: NestGroupInGroupPayload) => NestGroupInGroupAction.create(payload),
	unnestGroup: (groupId: string) => UnnestGroupAction.create(groupId),
	moveItemBetweenPools: (itemId: string, targetPoolIndex: number) => MoveItemBetweenPoolsAction.create(itemId, targetPoolIndex),
	moveGroupBetweenPools: (groupId: string, targetPoolIndex: number) => MoveGroupBetweenPoolsAction.create(groupId, targetPoolIndex),
	balanceWeights: (poolIndex: number, targetTotal?: number) => BalanceWeightsAction.create(poolIndex, targetTotal),
	conditionalLoot: (payload: ConditionalLootPayload) => ConditionalLootAction.create(payload)
};

export function isLootTableActionInstance(action: ActionLike): action is LootTableActionInstance {
	return isEngineAction(action) && LOOT_TABLE_ACTION_CLASSES.some((ctor) => action instanceof ctor);
}
