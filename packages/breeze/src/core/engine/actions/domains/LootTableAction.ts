import type { LootGroup, LootItem, LootTableProps } from "@/core/schema/loot/types";
import { defineActionDomain, type ActionJsonFromClasses } from "@/core/engine/actions/domain";
import { EngineAction, type ActionExecutionContext, type ActionLike } from "@/core/engine/actions/EngineAction";

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
	static create(payload: AddLootItemPayload): AddLootItemAction {
		return new AddLootItemAction(payload);
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
	static create(itemId: string): RemoveLootItemAction {
		return new RemoveLootItemAction({ itemId });
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
	static create(payload: ModifyLootItemPayload): ModifyLootItemAction {
		return new ModifyLootItemAction(payload);
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
	static create(itemId: string, targetPoolIndex?: number): DuplicateLootItemAction {
		return new DuplicateLootItemAction({ itemId, targetPoolIndex });
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
	static create(payload: BulkModifyItemsPayload): BulkModifyItemsAction {
		return new BulkModifyItemsAction(payload);
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
	static create(payload: CreateLootGroupPayload): CreateLootGroupAction {
		return new CreateLootGroupAction(payload);
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
	static create(payload: ModifyLootGroupPayload): ModifyLootGroupAction {
		return new ModifyLootGroupAction(payload);
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
	static create(groupId: string): DissolveLootGroupAction {
		return new DissolveLootGroupAction({ groupId });
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
	static create(payload: ConvertItemToGroupPayload): ConvertItemToGroupAction {
		return new ConvertItemToGroupAction(payload);
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
	static create(groupId: string, keepFirstItem?: boolean): ConvertGroupToItemAction {
		return new ConvertGroupToItemAction({ groupId, keepFirstItem });
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
	static create(payload: NestGroupInGroupPayload): NestGroupInGroupAction {
		return new NestGroupInGroupAction(payload);
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
	static create(groupId: string): UnnestGroupAction {
		return new UnnestGroupAction({ groupId });
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
	static create(itemId: string, targetPoolIndex: number): MoveItemBetweenPoolsAction {
		return new MoveItemBetweenPoolsAction({ itemId, targetPoolIndex });
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
	static create(groupId: string, targetPoolIndex: number): MoveGroupBetweenPoolsAction {
		return new MoveGroupBetweenPoolsAction({ groupId, targetPoolIndex });
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
	static create(poolIndex: number, targetTotal?: number): BalanceWeightsAction {
		return new BalanceWeightsAction({ poolIndex, targetTotal });
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
	static create(payload: ConditionalLootPayload): ConditionalLootAction {
		return new ConditionalLootAction(payload);
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

const LOOT_TABLE_ACTION_DOMAIN = defineActionDomain("loot_table", [
	["addLootItem", "add_loot_item", AddLootItemAction, (payload: AddLootItemPayload) => AddLootItemAction.create(payload)],
	["removeLootItem", "remove_loot_item", RemoveLootItemAction, (itemId: string) => RemoveLootItemAction.create(itemId)],
	["modifyLootItem", "modify_loot_item", ModifyLootItemAction, (payload: ModifyLootItemPayload) => ModifyLootItemAction.create(payload)],
	[
		"duplicateLootItem",
		"duplicate_loot_item",
		DuplicateLootItemAction,
		(itemId: string, targetPoolIndex?: number) => DuplicateLootItemAction.create(itemId, targetPoolIndex)
	],
	[
		"bulkModifyItems",
		"bulk_modify_items",
		BulkModifyItemsAction,
		(payload: BulkModifyItemsPayload) => BulkModifyItemsAction.create(payload)
	],
	[
		"createLootGroup",
		"create_loot_group",
		CreateLootGroupAction,
		(payload: CreateLootGroupPayload) => CreateLootGroupAction.create(payload)
	],
	[
		"modifyLootGroup",
		"modify_loot_group",
		ModifyLootGroupAction,
		(payload: ModifyLootGroupPayload) => ModifyLootGroupAction.create(payload)
	],
	["dissolveLootGroup", "dissolve_loot_group", DissolveLootGroupAction, (groupId: string) => DissolveLootGroupAction.create(groupId)],
	[
		"convertItemToGroup",
		"convert_item_to_group",
		ConvertItemToGroupAction,
		(payload: ConvertItemToGroupPayload) => ConvertItemToGroupAction.create(payload)
	],
	[
		"convertGroupToItem",
		"convert_group_to_item",
		ConvertGroupToItemAction,
		(groupId: string, keepFirstItem?: boolean) => ConvertGroupToItemAction.create(groupId, keepFirstItem)
	],
	[
		"nestGroupInGroup",
		"nest_group_in_group",
		NestGroupInGroupAction,
		(payload: NestGroupInGroupPayload) => NestGroupInGroupAction.create(payload)
	],
	["unnestGroup", "unnest_group", UnnestGroupAction, (groupId: string) => UnnestGroupAction.create(groupId)],
	[
		"moveItemBetweenPools",
		"move_item_between_pools",
		MoveItemBetweenPoolsAction,
		(itemId: string, targetPoolIndex: number) => MoveItemBetweenPoolsAction.create(itemId, targetPoolIndex)
	],
	[
		"moveGroupBetweenPools",
		"move_group_between_pools",
		MoveGroupBetweenPoolsAction,
		(groupId: string, targetPoolIndex: number) => MoveGroupBetweenPoolsAction.create(groupId, targetPoolIndex)
	],
	[
		"balanceWeights",
		"balance_weights",
		BalanceWeightsAction,
		(poolIndex: number, targetTotal?: number) => BalanceWeightsAction.create(poolIndex, targetTotal)
	],
	[
		"conditionalLoot",
		"conditional_loot",
		ConditionalLootAction,
		(payload: ConditionalLootPayload) => ConditionalLootAction.create(payload)
	]
] as const);

export const LOOT_TABLE_ACTION_CLASSES = LOOT_TABLE_ACTION_DOMAIN.classes;
export const LootTableActions = LOOT_TABLE_ACTION_DOMAIN.builders;

export type LootTableAction = ActionJsonFromClasses<typeof LOOT_TABLE_ACTION_CLASSES>;
