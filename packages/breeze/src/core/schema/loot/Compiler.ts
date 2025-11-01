import type { Analysers } from "@/core/engine/Analyser";
import type { Compiler } from "@/core/engine/Compiler";
import type { LootGroup, LootItem, LootTableProps, MinecraftLootEntry, MinecraftLootTable } from "./types";

/**
 * Compile Voxel format back to Minecraft LootTable - Ultra-simplified version
 */
export const VoxelToLootDataDriven: Compiler<LootTableProps, MinecraftLootTable> = (
	originalElement: LootTableProps,
	_: keyof Analysers,
	original?: MinecraftLootTable
) => {
	const element = structuredClone(originalElement);
	const lootTable = original ? structuredClone(original) : {};

	if (element.disabled) {
		return { element: { data: {}, identifier: element.identifier }, tags: [] };
	}

	const itemMap = new Map(element.items.map((item) => [item.id, item]));
	const groupMap = new Map(element.groups.map((group) => [group.id, group]));
	const poolDataMap = new Map(element.pools?.map((p) => [p.poolIndex, p]) || []);

	const maxPool = Math.max(
		...element.items.map((i) => i.poolIndex),
		...element.groups.map((g) => g.poolIndex),
		...(element.pools?.map((p) => p.poolIndex) || []),
		(original?.pools?.length || 1) - 1,
		0
	);

	const pools = Array.from({ length: maxPool + 1 }, (_, i) => {
		const poolData = poolDataMap.get(i);
		const originalPool = original?.pools?.[i];

		const pool: any = {
			rolls: poolData?.rolls ?? originalPool?.rolls ?? 1,
			bonus_rolls: poolData?.bonus_rolls || originalPool?.bonus_rolls,
			functions: poolData?.functions || originalPool?.functions || [],
			conditions: poolData?.conditions || originalPool?.conditions || [],
			entries: []
		};

		if (originalPool) {
			for (const key in originalPool) {
				pool[key] = originalPool[key];
			}
		}

		return pool;
	});

	const itemsInGroups = new Set(element.groups.flatMap((g) => g.items));

	const childGroups = new Set(element.groups.flatMap((g) => g.items).filter((id) => groupMap.has(id)));

	for (const item of element.items) {
		if (!itemsInGroups.has(item.id)) {
			pools[item.poolIndex]?.entries.push(buildEntry(item));
		}
	}

	for (const group of element.groups) {
		if (!childGroups.has(group.id)) {
			pools[group.poolIndex]?.entries.push(buildGroupEntry(group, itemMap, groupMap));
		}
	}

	return {
		element: {
			data: {
				...lootTable,
				type: element.type,
				pools,
				random_sequence: element.randomSequence,
				...(element.functions?.length && { functions: element.functions })
			},
			identifier: element.identifier
		},
		tags: []
	};
};

/**
 * Build entry from item.
 */
function buildEntry(item: LootItem): MinecraftLootEntry {
	const entryType = item.entryType || "minecraft:item";

	const entry: MinecraftLootEntry = {
		type: entryType,
		...(item.weight && { weight: item.weight }),
		...(item.quality !== undefined && { quality: item.quality }),
		...(item.conditions?.length && { conditions: item.conditions }),
		...(item.functions?.length && { functions: item.functions }),
		...(item.expand !== undefined && { expand: item.expand })
	};

	if (entryType === "minecraft:loot_table") entry.value = item.value ?? item.name;
	else if (entryType === "minecraft:tag") entry.name = item.name.replace(/^#/, "");
	else if (entryType !== "minecraft:empty") entry.name = item.name;

	return entry;
}

/**
 * Build group entry recursively.
 */
function buildGroupEntry(group: LootGroup, itemMap: Map<string, LootItem>, groupMap: Map<string, LootGroup>): MinecraftLootEntry {
	return {
		type: `minecraft:${group.type}`,
		children: group.items
			.map((id) => {
				const nestedGroup = groupMap.get(id);
				if (nestedGroup) return buildGroupEntry(nestedGroup, itemMap, groupMap);

				const item = itemMap.get(id);
				return item ? buildEntry(item) : null;
			})
			.filter((entry): entry is MinecraftLootEntry => entry !== null),
		...(group.conditions?.length && { conditions: group.conditions }),
		functions: group.functions || []
	};
}
