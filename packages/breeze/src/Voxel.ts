import type { DataDrivenRegistryElement } from "@/core/Element";
import type { TagType } from "@/core/Tag";

export const VOXEL_TAGS: DataDrivenRegistryElement<TagType>[] = [
	{
		identifier: { namespace: "voxel", registry: "tags/item", resource: "enchantable/axes" },
		data: { values: ["#minecraft:axes"] }
	},
	{
		identifier: { namespace: "voxel", registry: "tags/item", resource: "enchantable/hoes" },
		data: { values: ["#minecraft:hoes"] }
	},
	{
		identifier: { namespace: "voxel", registry: "tags/item", resource: "enchantable/pickaxes" },
		data: { values: ["#minecraft:pickaxes"] }
	},
	{
		identifier: { namespace: "voxel", registry: "tags/item", resource: "enchantable/shovels" },
		data: { values: ["#minecraft:shovels"] }
	},
	{
		identifier: { namespace: "voxel", registry: "tags/item", resource: "enchantable/elytra" },
		data: { values: ["minecraft:elytra"] }
	},
	{
		identifier: { namespace: "voxel", registry: "tags/item", resource: "enchantable/melee" },
		data: { values: ["#minecraft:enchantable/weapon", "#minecraft:enchantable/trident"] }
	},
	{
		identifier: { namespace: "voxel", registry: "tags/item", resource: "enchantable/range" },
		data: { values: ["#minecraft:enchantable/crossbow", "#minecraft:enchantable/bow"] }
	},
	{
		identifier: { namespace: "voxel", registry: "tags/item", resource: "enchantable/shield" },
		data: { values: ["minecraft:shield"] }
	}
];
