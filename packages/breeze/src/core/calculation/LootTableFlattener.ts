import type { DataDrivenRegistryElement } from "@/core/Element";
import { Identifier, type IdentifierObject } from "@/core/Identifier";
import { TagsComparator } from "@/core/TagComparator";
import type { LootGroup, LootItem, LootTableProps } from "@/core/schema/loot/types";
import type { TagType } from "@/core/Tag";

export interface FlattenedLootItem {
	name: string;
	entryType?: string;
	weight: number;
	probability: number;
	path: string[];
	sourcePool?: number;
	sourceEntry?: number;
	resolvedFromTag?: boolean;
	unresolved?: boolean;
	cycle?: boolean;
	id?: string;
	functions?: any[];
}

export interface FlattenOptions {
	maxDepth?: number;
}

interface TableIndex {
	table: LootTableProps;
	items: Map<string, LootItem>;
	groups: Map<string, LootGroup>;
	itemsInGroups: Set<string>;
	childGroups: Set<string>;
}

interface PoolEntry {
	item?: LootItem;
	group?: LootGroup;
}

interface FlattenContext {
	path: string[];
	depth: number;
	probability: number;
	weight: number;
	maxDepth: number;
	visited: Set<string>;
}

export class LootTableFlattener {
	private readonly tables = new Map<string, TableIndex>();
	private readonly comparator?: TagsComparator;

	constructor(lootTables: LootTableProps[], itemTags: DataDrivenRegistryElement<TagType>[] = []) {
		for (const table of lootTables) this.tables.set(this.tableKey(table), this.createIndex(table));
		if (itemTags.length) this.comparator = new TagsComparator(itemTags);
	}

	flatten(target: IdentifierObject | string, options: FlattenOptions = {}): FlattenedLootItem[] {
		const key = typeof target === "string" ? Identifier.of(target, "loot_table").toString() : new Identifier(target).toString();
		const ctx: FlattenContext = {
			path: [key],
			depth: 0,
			probability: 1,
			weight: 1,
			maxDepth: options.maxDepth ?? Number.POSITIVE_INFINITY,
			visited: new Set()
		};
		return this.flattenFromKey(key, ctx);
	}

	private flattenFromKey(key: string, ctx: FlattenContext): FlattenedLootItem[] {
		if (ctx.visited.has(key)) return [this.makeCycle(ctx, key)];
		const index = this.tables.get(key);
		if (!index) return [this.makeUnresolved(ctx, key)];
		if (ctx.depth >= ctx.maxDepth) return [this.makeDepthLimit(ctx, key)];
		const next = this.enterTable(ctx, key);
		return this.collectPools(index).flatMap(([poolIndex, entries]) => this.flattenPool(index, entries, poolIndex, next));
	}

	private flattenPool(index: TableIndex, entries: PoolEntry[], poolIndex: number, ctx: FlattenContext): FlattenedLootItem[] {
		if (!entries.length) return [];
		const weights = entries.map((entry) => this.entryWeight(entry));
		const total = weights.reduce((sum, value) => sum + value, 0);
		if (!total) return [];
		const output: FlattenedLootItem[] = [];
		for (let idx = 0; idx < entries.length; idx++) {
			const share = weights[idx] / total;
			const next: FlattenContext = {
				...ctx,
				probability: ctx.probability * share,
				weight: ctx.weight * weights[idx]
			};
			output.push(...this.flattenEntry(index, entries[idx], poolIndex, next));
		}
		return output;
	}

	private flattenEntry(index: TableIndex, entry: PoolEntry, poolIndex: number, ctx: FlattenContext): FlattenedLootItem[] {
		if (entry.item) return this.flattenItem(entry.item, poolIndex, ctx);
		if (entry.group) return this.flattenGroup(index, entry.group, poolIndex, ctx);
		return [];
	}

	private flattenItem(item: LootItem, poolIndex: number, ctx: FlattenContext): FlattenedLootItem[] {
		if (item.entryType === "minecraft:loot_table") return this.flattenReference(item, ctx);
		if (item.entryType === "minecraft:tag" && this.comparator) return this.flattenTag(item, poolIndex, ctx);
		return [this.makeLeaf(ctx, item, poolIndex, item.name)];
	}

	private flattenReference(item: LootItem, ctx: FlattenContext): FlattenedLootItem[] {
		const ref = Identifier.of(item.value ?? item.name, "loot_table").toString();
		const next: FlattenContext = { ...ctx, path: [...ctx.path, ref], depth: ctx.depth + 1 };
		return this.flattenFromKey(ref, next);
	}

	private flattenTag(item: LootItem, poolIndex: number, ctx: FlattenContext): FlattenedLootItem[] {
		const values = this.resolveTagValues(item.name);
		if (!values.length) return [this.makeUnresolved(ctx, item.name)];
		const share = 1 / values.length;
		const output: FlattenedLootItem[] = [];
		for (const value of values)
			output.push(
				this.makeLeaf({ ...ctx, probability: ctx.probability * share, weight: ctx.weight * share }, item, poolIndex, value, true)
			);
		return output;
	}

	private flattenGroup(index: TableIndex, group: LootGroup, poolIndex: number, ctx: FlattenContext): FlattenedLootItem[] {
		const ids = group.items.filter((id) => this.isValidGroupEntry(index, id));
		if (!ids.length) return [];
		if (group.type === "alternatives") return this.flattenAlternatives(index, ids, poolIndex, ctx);
		return ids.flatMap((id) => this.flattenEntry(index, this.lookupEntry(index, id), poolIndex, ctx));
	}

	private flattenAlternatives(index: TableIndex, ids: string[], poolIndex: number, ctx: FlattenContext): FlattenedLootItem[] {
		const entries = ids.map((id) => this.lookupEntry(index, id));
		const weights = entries.map((entry) => this.entryWeight(entry));
		const total = weights.reduce((sum, value) => sum + value, 0);
		if (!total) return [];
		const output: FlattenedLootItem[] = [];
		for (let idx = 0; idx < entries.length; idx++) {
			const share = weights[idx] / total;
			const next: FlattenContext = {
				...ctx,
				probability: ctx.probability * share,
				weight: ctx.weight * weights[idx]
			};
			output.push(...this.flattenEntry(index, entries[idx], poolIndex, next));
		}
		return output;
	}

	private collectPools(index: TableIndex): Array<[number, PoolEntry[]]> {
		const pools = new Map<number, PoolEntry[]>();
		for (const item of index.table.items) if (!index.itemsInGroups.has(item.id)) this.pushEntry(pools, item.poolIndex, { item });
		for (const group of index.table.groups) if (!index.childGroups.has(group.id)) this.pushEntry(pools, group.poolIndex, { group });
		return Array.from(pools.entries()).sort(([a], [b]) => a - b);
	}

	private pushEntry(map: Map<number, PoolEntry[]>, key: number, entry: PoolEntry) {
		const list = map.get(key);
		if (list) list.push(entry);
		else map.set(key, [entry]);
	}

	private lookupEntry(index: TableIndex, id: string): PoolEntry {
		const item = index.items.get(id);
		if (item) return { item };
		const group = index.groups.get(id);
		return group ? { group } : {};
	}

	private entryWeight(entry: PoolEntry): number {
		return entry.item?.weight ?? 1;
	}

	private isValidGroupEntry(index: TableIndex, id: string): boolean {
		return index.items.has(id) || index.groups.has(id);
	}

	private resolveTagValues(name: string): string[] {
		if (!this.comparator) return [];
		const normalized = name.startsWith("#") ? name : `#${name}`;
		return this.comparator.getRecursiveValues(Identifier.of(normalized, "tags/item").get());
	}

	private makeLeaf(ctx: FlattenContext, item: LootItem, poolIndex: number, name: string, fromTag = false): FlattenedLootItem {
		return {
			name,
			entryType: item.entryType,
			weight: ctx.weight,
			probability: ctx.probability,
			path: ctx.path,
			sourcePool: poolIndex,
			sourceEntry: item.entryIndex,
			resolvedFromTag: fromTag,
			id: item.id,
			functions: item.functions
		};
	}

	private makeUnresolved(ctx: FlattenContext, ref: string): FlattenedLootItem {
		return { name: ref, weight: ctx.weight, probability: ctx.probability, path: ctx.path, unresolved: true };
	}

	private makeCycle(ctx: FlattenContext, ref: string): FlattenedLootItem {
		return { name: ref, weight: ctx.weight, probability: ctx.probability, path: ctx.path, cycle: true };
	}

	private makeDepthLimit(ctx: FlattenContext, ref: string): FlattenedLootItem {
		return { name: ref, weight: ctx.weight, probability: ctx.probability, path: ctx.path, unresolved: true };
	}

	private enterTable(ctx: FlattenContext, key: string): FlattenContext {
		const visited = new Set(ctx.visited);
		visited.add(key);
		return { ...ctx, visited };
	}

	private tableKey(table: LootTableProps): string {
		return new Identifier(table.identifier).toString();
	}

	private createIndex(table: LootTableProps): TableIndex {
		const items = new Map(table.items.map((item) => [item.id, item] as const));
		const groups = new Map(table.groups.map((group) => [group.id, group] as const));
		const itemsInGroups = new Set<string>();
		const childGroups = new Set<string>();
		for (const group of table.groups)
			for (const id of group.items) {
				itemsInGroups.add(id);
				if (groups.has(id)) childGroups.add(id);
			}
		return { table, items, groups, itemsInGroups, childGroups };
	}
}
