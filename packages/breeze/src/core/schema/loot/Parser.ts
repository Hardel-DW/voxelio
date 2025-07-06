import type { Parser, ParserParams } from "@/core/engine/Parser";
import { extractUnknownFields } from "@/core/schema/utils";
import type { LootGroup, LootItem, LootTableProps, MinecraftLootEntry, MinecraftLootTable, PoolData } from "./types";
import { KNOWN_ENTRY_FIELDS, KNOWN_POOL_FIELDS, KNOWN_TABLE_FIELDS } from "./types";

/**
 * Parse Minecraft LootTable to simplified Voxel format.
 */
export const LootDataDrivenToVoxelFormat: Parser<LootTableProps, MinecraftLootTable> = ({
    element,
    configurator
}: ParserParams<MinecraftLootTable>): LootTableProps => {
    const data = structuredClone(element.data);
    const items: LootItem[] = [];
    const groups: LootGroup[] = [];
    let itemCounter = 0;
    let groupCounter = 0;

    data.pools?.forEach((pool, poolIndex) => {
        pool.entries?.forEach((entry, entryIndex) => {
            processEntry(entry, poolIndex, entryIndex);
        });
    });

    const pools: PoolData[] =
        data.pools?.map((pool, poolIndex) => ({
            poolIndex,
            rolls: pool.rolls,
            ...(pool.bonus_rolls !== undefined && { bonus_rolls: pool.bonus_rolls }),
            ...(pool.functions?.length && { functions: pool.functions }),
            ...(pool.conditions?.length && { conditions: pool.conditions }),
            ...(extractUnknownFields(pool, KNOWN_POOL_FIELDS) && { unknownFields: extractUnknownFields(pool, KNOWN_POOL_FIELDS) })
        })) || [];

    // Determine if loot table should be disabled
    const disabled = items.length === 0 && groups.length === 0 && (!data.pools || data.pools.length === 0);

    return {
        identifier: element.identifier,
        type: data.type,
        items,
        groups,
        disabled,
        ...(data.random_sequence && { randomSequence: data.random_sequence }),
        ...(data.functions?.length && { functions: data.functions }),
        ...(pools.length && { pools }),
        ...(extractUnknownFields(data, KNOWN_TABLE_FIELDS) && { unknownFields: extractUnknownFields(data, KNOWN_TABLE_FIELDS) }),
        override: configurator
    };

    /**
     * Process entry recursively.
     */
    function processEntry(entry: MinecraftLootEntry, poolIndex: number, entryIndex: number): string {
        const isGroup = entry.type.includes("alternatives") || entry.type.includes("group") || entry.type.includes("sequence");

        if (isGroup) {
            const groupId = `group_${groupCounter++}`;
            const groupType = entry.type.replace("minecraft:", "") as "alternatives" | "group" | "sequence";

            const childIds = entry.children?.map((child) => processEntry(child, poolIndex, entryIndex)) || [];

            groups.push({
                id: groupId,
                type: groupType,
                items: childIds,
                poolIndex,
                entryIndex,
                ...(entry.conditions?.length && { conditions: entry.conditions }),
                ...(entry.functions?.length && { functions: entry.functions }),
                ...(extractUnknownFields(entry, KNOWN_ENTRY_FIELDS) && { unknownFields: extractUnknownFields(entry, KNOWN_ENTRY_FIELDS) })
            });

            return groupId;
        }

        const itemId = `item_${itemCounter++}`;
        let name = "";
        let value = undefined;

        if (entry.type === "minecraft:loot_table") {
            const tableName = entry.value ?? entry.name;
            if (typeof tableName === "string") {
                name = tableName;
            } else {
                name = "embedded_table";
                value = tableName;
            }
        } else if (entry.type === "minecraft:empty") {
            name = "minecraft:empty";
        } else {
            name = entry.name ?? "";
            if (entry.type === "minecraft:tag" && name && !name.startsWith("#")) {
                name = `#${name}`;
            }
        }

        items.push({
            id: itemId,
            name,
            entryType: entry.type,
            poolIndex,
            entryIndex,
            ...(value !== undefined && { value }),
            ...(entry.weight !== undefined && { weight: entry.weight }),
            ...(entry.quality !== undefined && { quality: entry.quality }),
            ...(entry.conditions?.length && { conditions: entry.conditions }),
            ...(entry.functions?.length && { functions: entry.functions }),
            ...(entry.expand !== undefined && { expand: entry.expand }),
            ...(extractUnknownFields(entry, KNOWN_ENTRY_FIELDS) && { unknownFields: extractUnknownFields(entry, KNOWN_ENTRY_FIELDS) })
        });

        return itemId;
    }
};
