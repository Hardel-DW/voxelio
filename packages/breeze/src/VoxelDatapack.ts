import type { DataDrivenRegistryElement } from "@/core/Element";
import type { TagType } from "@/schema/TagType";

const axes: TagType = {
    values: ["#minecraft:axes"]
};

const hoes: TagType = {
    values: ["#minecraft:hoes"]
};

const pickaxes: TagType = {
    values: ["#minecraft:pickaxes"]
};

const shovels: TagType = {
    values: ["#minecraft:shovels"]
};

const elytra: TagType = {
    values: ["minecraft:elytra"]
};

const melee: TagType = {
    values: ["#minecraft:enchantable/weapon", "#minecraft:enchantable/trident"]
};

const range: TagType = {
    values: ["#minecraft:enchantable/crossbow", "#minecraft:enchantable/bow"]
};

const shield: TagType = {
    values: ["minecraft:shield"]
};

export const voxelDatapacks: DataDrivenRegistryElement<TagType>[] = [
    {
        identifier: {
            namespace: "voxel",
            registry: "tags/item",
            resource: "enchantable/axes"
        },
        data: axes
    },
    {
        identifier: {
            namespace: "voxel",
            registry: "tags/item",
            resource: "enchantable/hoes"
        },
        data: hoes
    },
    {
        identifier: {
            namespace: "voxel",
            registry: "tags/item",
            resource: "enchantable/pickaxes"
        },
        data: pickaxes
    },
    {
        identifier: {
            namespace: "voxel",
            registry: "tags/item",
            resource: "enchantable/shovels"
        },
        data: shovels
    },
    {
        identifier: {
            namespace: "voxel",
            registry: "tags/item",
            resource: "enchantable/elytra"
        },
        data: elytra
    },
    {
        identifier: {
            namespace: "voxel",
            registry: "tags/item",
            resource: "enchantable/melee"
        },
        data: melee
    },
    {
        identifier: {
            namespace: "voxel",
            registry: "tags/item",
            resource: "enchantable/range"
        },
        data: range
    },
    {
        identifier: {
            namespace: "voxel",
            registry: "tags/item",
            resource: "enchantable/shield"
        },
        data: shield
    }
];
