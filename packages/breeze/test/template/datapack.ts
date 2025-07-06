import { voxelDatapacks } from "@/index";
import { simpleEnchantment, DATA_DRIVEN_TEMPLATE_ENCHANTMENT } from "./concept/enchant/DataDriven";
import { enchantplusTags, fireAspectTag, swordAttributeTag, vanillaTags } from "./concept/enchant/DataDrivenTags";
import { completeLootTable, advancedLootTable, ultimateTestLootTable, finalBossOfLootTable } from "./concept/loot/DataDriven";
import { prepareFiles, createFilesFromElements, createZipFile } from "./utils";
import { recipeDataDriven } from "./concept/recipe/DataDriven";
import { structureDataDriven } from "./concept/structure/DataDriven";
import { structureSetDataDriven } from "./concept/structure_set/DataDriven";

export const lootTableFile = {
    "data/test/loot_table/test.json": completeLootTable,
    "data/test/loot_table/advanced.json": advancedLootTable,
    "data/test/loot_table/ultimate.json": ultimateTestLootTable,
    "data/test/loot_table/final_boss.json": finalBossOfLootTable
};

export const enchantmentFile = {
    "data/enchantplus/enchantment/sword/attack_speed.json": simpleEnchantment,
    "data/enchantplus/tags/enchantment/exclusive_set/sword_attribute.json": swordAttributeTag,
    "data/minecraft/tags/enchantment/non_treasure.json": fireAspectTag,
    "data/yggdrasil/tags/enchantment/equipment/item/sword.json": fireAspectTag
};

export const registryFile = {
    "data/enchantplus/enchantment/armor/fury.json": { foo: "bar" },
    "data/minecraft/enchantment/attack_speed.json": { foo: "bar" },
    "data/minecraft/enchantment_provider/villager.json": { foo: "bar" },
    "data/enchantplus/tags/enchantment/armor.json": { values: ["enchantplus:fury"] },
    "data/minecraft/tags/enchantment/weapon.json": { values: ["minecraft:attack_speed"] }
};

export const testMcMetaNotExists = {
    "data/enchantplus/enchantment/test.json": new TextEncoder().encode(JSON.stringify({}, null, 2))
};

export const enchantmentWithTagFiles = createFilesFromElements([
    ...DATA_DRIVEN_TEMPLATE_ENCHANTMENT,
    ...voxelDatapacks,
    ...enchantplusTags,
    ...vanillaTags
]);

export const recipeFile = createFilesFromElements(recipeDataDriven);
export const structureFile = createFilesFromElements(structureDataDriven);
export const structureSetFile = createFilesFromElements(structureSetDataDriven);
export const nonValidMcmetaZip = prepareFiles({}, -1);
export const lootTableZip = await createZipFile(prepareFiles(lootTableFile));
