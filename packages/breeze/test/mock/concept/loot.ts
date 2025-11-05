import type { MinecraftLootTable } from "@/core/schema/loot/types";
import type { DataDrivenRegistryElement } from "@/core/Element";

export const simple: DataDrivenRegistryElement<MinecraftLootTable> = {
	identifier: { namespace: "test", registry: "loot_table", resource: "simple" },
	data: {
		type: "minecraft:entity",
		pools: [
			{
				rolls: 1,
				bonus_rolls: 0,
				entries: [
					{
						type: "minecraft:item",
						name: "minecraft:experience_bottle",
						functions: [
							{
								function: "minecraft:set_count",
								count: {
									min: 1,
									max: 3
								}
							}
						],
						conditions: [
							{
								condition: "minecraft:random_chance",
								chance: 0.5
							}
						]
					}
				]
			}
		]
	}
};

export const extreme: DataDrivenRegistryElement<MinecraftLootTable> = {
	identifier: { namespace: "test", registry: "loot_table", resource: "extreme" },
	data: {
		type: "minecraft:entity",
		pools: [
			{
				rolls: 5,
				entries: [
					{
						type: "minecraft:alternatives",
						children: [
							{
								type: "minecraft:dynamic",
								name: "minecraft:contents"
							},
							{
								type: "minecraft:group",
								children: [
									{
										type: "minecraft:sequence",
										children: [
											{
												type: "minecraft:item",
												name: "minecraft:amethyst_shard"
											}
										]
									}
								]
							}
						]
					}
				]
			}
		],
		random_sequence: "minecraft:entities/wither_skeleton"
	}
};

export const reference: DataDrivenRegistryElement<MinecraftLootTable> = {
	identifier: { namespace: "test", registry: "loot_table", resource: "reference" },
	data: {
		type: "minecraft:equipment",
		pools: [
			{
				rolls: 1,
				bonus_rolls: 0,
				entries: [
					{
						type: "minecraft:loot_table",
						value: "yggdrasil:generic/equipment/ominous/item/sword"
					}
				]
			},
			{
				rolls: 1,
				bonus_rolls: 0,
				entries: [
					{
						type: "minecraft:loot_table",
						value: "yggdrasil:generic/equipment/ominous/item/helmet"
					}
				]
			},
			{
				rolls: 1,
				bonus_rolls: 0,
				entries: [
					{
						type: "minecraft:loot_table",
						value: "yggdrasil:generic/equipment/ominous/item/chestplate"
					}
				]
			}
		],
		random_sequence: "yggdrasil:equipment"
	}
};

export const complete: DataDrivenRegistryElement<MinecraftLootTable> = {
	identifier: { namespace: "test", registry: "loot_table", resource: "test" },
	data: {
		pools: [
			{
				rolls: 0,
				entries: [
					{
						type: "minecraft:item",
						name: "minecraft:acacia_sapling"
					}
				],
				functions: [
					{
						function: "minecraft:set_count",
						count: 2,
						conditions: [
							{
								condition: "minecraft:value_check",
								value: 1,
								range: 0
							}
						]
					}
				],
				conditions: []
			}
		],
		functions: [
			{
				function: "minecraft:enchant_with_levels",
				levels: 10
			}
		],
		random_sequence: "minecraft:entities/wither_skeleton"
	}
};

export const advanced: DataDrivenRegistryElement<MinecraftLootTable> = {
	identifier: { namespace: "test", registry: "loot_table", resource: "advanced" },
	data: {
		pools: [
			{
				rolls: 0,
				entries: [
					{
						type: "minecraft:item",
						name: "minecraft:acacia_sapling"
					},
					{
						type: "minecraft:group",
						children: [
							{
								type: "minecraft:tag",
								name: "minecraft:bundles",
								expand: true
							}
						],
						functions: [
							{
								function: "minecraft:set_attributes",
								modifiers: [
									{
										attribute: "minecraft:spawn_reinforcements",
										id: "0",
										amount: 0,
										operation: "add_value",
										slot: "mainhand"
									}
								],
								replace: false
							}
						]
					}
				],
				functions: [
					{
						function: "minecraft:set_count",
						count: 2,
						conditions: [
							{
								condition: "minecraft:value_check",
								value: 1,
								range: 0
							}
						]
					}
				],
				conditions: []
			}
		],
		functions: [
			{
				function: "minecraft:enchant_with_levels",
				levels: 10
			}
		],
		random_sequence: "minecraft:entities/wither_skeleton"
	}
};

export const ultimate: DataDrivenRegistryElement<MinecraftLootTable> = {
	identifier: { namespace: "test", registry: "loot_table", resource: "ultimate" },
	data: {
		pools: [
			{
				rolls: 0,
				entries: [
					{
						type: "minecraft:item",
						name: "minecraft:acacia_sapling"
					},
					{
						type: "minecraft:group",
						children: [
							{
								type: "minecraft:tag",
								name: "minecraft:bundles",
								expand: true
							}
						],
						functions: []
					},
					{
						type: "minecraft:loot_table",
						value: "minecraft:blocks/acacia_wood"
					},
					{
						type: "minecraft:empty"
					},
					{
						type: "minecraft:alternatives",
						children: [
							{
								type: "minecraft:group",
								children: [
									{
										type: "minecraft:tag",
										name: "minecraft:cherry_logs",
										expand: true,
										conditions: [
											{
												condition: "minecraft:value_check",
												value: 0,
												range: {}
											}
										]
									}
								]
							}
						]
					}
				],
				functions: [
					{
						function: "minecraft:set_count",
						count: 2,
						conditions: [
							{
								condition: "minecraft:value_check",
								value: 1,
								range: 0
							}
						]
					}
				],
				conditions: []
			}
		],
		functions: [
			{
				function: "minecraft:enchant_with_levels",
				levels: 10
			}
		],
		random_sequence: "minecraft:entities/wither_skeleton"
	}
};

export const finalBoss: DataDrivenRegistryElement<MinecraftLootTable> = {
	identifier: { namespace: "test", registry: "loot_table", resource: "final_boss" },
	data: {
		pools: [
			{
				rolls: 1,
				bonus_rolls: {
					type: "minecraft:binomial",
					n: 1,
					p: {
						type: "minecraft:enchantment_level",
						amount: {
							type: "minecraft:lookup",
							values: [1, 1],
							fallback: 1
						}
					}
				},
				entries: [
					{
						type: "minecraft:alternatives",
						children: [
							{
								type: "minecraft:empty",
								weight: 1,
								quality: 10,
								functions: [
									{
										function: "minecraft:copy_name",
										source: "this"
									}
								],
								conditions: [
									{
										condition: "minecraft:weather_check",
										raining: true,
										thundering: true
									}
								]
							}
						]
					},
					{
						type: "minecraft:dynamic",
						name: "minecraft:sherds"
					},
					{
						type: "minecraft:group",
						children: [
							{
								type: "minecraft:empty"
							}
						]
					},
					{
						type: "minecraft:item",
						name: "minecraft:acacia_sign"
					},
					{
						type: "minecraft:item",
						name: "minecraft:allium"
					},
					{
						type: "minecraft:loot_table",
						value: "minecraft:blocks/acacia_slab"
					},
					{
						type: "minecraft:loot_table",
						value: {
							type: "minecraft:block",
							pools: [
								{
									rolls: 1,
									entries: []
								}
							]
						}
					},
					{
						type: "minecraft:sequence",
						children: [
							{
								type: "minecraft:group",
								children: [
									{
										type: "minecraft:alternatives",
										children: [
											{
												type: "minecraft:empty"
											},
											{
												type: "minecraft:item",
												name: "minecraft:allium"
											}
										]
									}
								]
							}
						]
					},
					{
						type: "minecraft:tag",
						name: "minecraft:buttons",
						expand: true,
						weight: 1,
						quality: 10
					}
				],
				functions: [
					{
						function: "minecraft:apply_bonus",
						enchantment: "minecraft:looting",
						formula: "minecraft:ore_drops"
					}
				],
				conditions: [
					{
						condition: "minecraft:weather_check",
						raining: true
					}
				]
			},
			{
				rolls: 1,
				bonus_rolls: 1,
				entries: []
			}
		],
		functions: [
			{
				function: "minecraft:apply_bonus",
				enchantment: "minecraft:luck_of_the_sea",
				formula: "minecraft:ore_drops"
			}
		],
		random_sequence: "minecraft:entities/wither_skeleton"
	}
};

export const simpleFlat: DataDrivenRegistryElement<MinecraftLootTable> = {
	identifier: { namespace: "test", registry: "loot_table", resource: "simple_flat" },
	data: {
		pools: [
			{
				rolls: 1,
				entries: [
					{
						type: "minecraft:item",
						name: "minecraft:diamond"
					}
				]
			}
		]
	}
};

export const parentReference: DataDrivenRegistryElement<MinecraftLootTable> = {
	identifier: { namespace: "test", registry: "loot_table", resource: "parent" },
	data: {
		pools: [
			{
				rolls: 1,
				entries: [
					{
						type: "minecraft:loot_table",
						value: "test:child"
					}
				]
			}
		]
	}
};

export const childReference: DataDrivenRegistryElement<MinecraftLootTable> = {
	identifier: { namespace: "test", registry: "loot_table", resource: "child" },
	data: {
		pools: [
			{
				rolls: 1,
				entries: [
					{
						type: "minecraft:item",
						name: "minecraft:emerald"
					}
				]
			}
		]
	}
};

export const cyclicFirst: DataDrivenRegistryElement<MinecraftLootTable> = {
	identifier: { namespace: "test", registry: "loot_table", resource: "first" },
	data: {
		pools: [
			{
				rolls: 1,
				entries: [
					{
						type: "minecraft:loot_table",
						value: "test:second"
					}
				]
			}
		]
	}
};

export const cyclicSecond: DataDrivenRegistryElement<MinecraftLootTable> = {
	identifier: { namespace: "test", registry: "loot_table", resource: "second" },
	data: {
		pools: [
			{
				rolls: 1,
				entries: [
					{
						type: "minecraft:loot_table",
						value: "test:first"
					}
				]
			}
		]
	}
};

export const tagged: DataDrivenRegistryElement<MinecraftLootTable> = {
	identifier: { namespace: "test", registry: "loot_table", resource: "tagged" },
	data: {
		pools: [
			{
				rolls: 1,
				entries: [
					{
						type: "minecraft:tag",
						name: "test:ores",
						expand: true
					}
				]
			}
		]
	}
};

export const altParent: DataDrivenRegistryElement<MinecraftLootTable> = {
	identifier: { namespace: "test", registry: "loot_table", resource: "alt_parent" },
	data: {
		pools: [
			{
				rolls: 1,
				entries: [
					{
						type: "minecraft:alternatives",
						children: [
							{
								type: "minecraft:loot_table",
								value: "test:alt_child_a",
								weight: 1
							},
							{
								type: "minecraft:loot_table",
								value: "test:alt_child_b",
								weight: 3
							}
						]
					}
				]
			}
		]
	}
};

export const altChildA: DataDrivenRegistryElement<MinecraftLootTable> = {
	identifier: { namespace: "test", registry: "loot_table", resource: "alt_child_a" },
	data: {
		pools: [
			{
				rolls: 1,
				entries: [
					{
						type: "minecraft:item",
						name: "minecraft:emerald"
					}
				]
			}
		]
	}
};

export const altChildB: DataDrivenRegistryElement<MinecraftLootTable> = {
	identifier: { namespace: "test", registry: "loot_table", resource: "alt_child_b" },
	data: {
		pools: [
			{
				rolls: 1,
				entries: [
					{
						type: "minecraft:item",
						name: "minecraft:diamond"
					}
				]
			}
		]
	}
};

export const deepTop: DataDrivenRegistryElement<MinecraftLootTable> = {
	identifier: { namespace: "test", registry: "loot_table", resource: "top" },
	data: {
		pools: [
			{
				rolls: 1,
				entries: [
					{
						type: "minecraft:loot_table",
						value: "test:mid"
					}
				]
			}
		]
	}
};

export const deepMid: DataDrivenRegistryElement<MinecraftLootTable> = {
	identifier: { namespace: "test", registry: "loot_table", resource: "mid" },
	data: {
		pools: [
			{
				rolls: 1,
				entries: [
					{
						type: "minecraft:loot_table",
						value: "test:bottom"
					}
				]
			}
		]
	}
};

export const deepBottom: DataDrivenRegistryElement<MinecraftLootTable> = {
	identifier: { namespace: "test", registry: "loot_table", resource: "bottom" },
	data: {
		pools: [
			{
				rolls: 1,
				entries: [
					{
						type: "minecraft:item",
						name: "minecraft:gold_block"
					}
				]
			}
		]
	}
};

export const simulation: DataDrivenRegistryElement<MinecraftLootTable> = {
	identifier: { namespace: "test", registry: "loot_table", resource: "simulation" },
	data: {
		type: "minecraft:chest",
		pools: [
			{
				entries: [
					{
						type: "minecraft:item",
						name: "minecraft:diamond_pickaxe",
						weight: 1
					},
					{
						type: "minecraft:item",
						name: "minecraft:diamond_shovel",
						weight: 2
					},
					{
						type: "minecraft:item",
						name: "minecraft:crossbow",
						weight: 3
					},
					{
						type: "minecraft:item",
						name: "minecraft:crossbow",
						weight: 4
					},
					{
						type: "minecraft:item",
						name: "minecraft:crossbow",
						weight: 5
					},
					{
						type: "minecraft:item",
						name: "minecraft:ancient_debris",
						weight: 6
					},
					{
						type: "minecraft:item",
						name: "minecraft:netherite_scrap",
						weight: 7
					},
					{
						type: "minecraft:item",
						name: "minecraft:spectral_arrow",
						weight: 8
					},
					{
						type: "minecraft:item",
						name: "minecraft:piglin_banner_pattern",
						weight: 9
					},
					{
						type: "minecraft:item",
						name: "minecraft:music_disc_pigstep",
						weight: 10
					},
					{
						type: "minecraft:item",
						name: "minecraft:golden_carrot",
						weight: 10
					},
					{
						type: "minecraft:item",
						name: "minecraft:golden_apple",
						weight: 10
					},
					{
						type: "minecraft:item",
						name: "minecraft:book",
						weight: 10
					}
				],
				rolls: 1
			}
		],
		random_sequence: "minecraft:chests/bastion_other"
	}
};

export const originalLootTables: Record<string, DataDrivenRegistryElement<MinecraftLootTable>> = {
	simple,
	extreme,
	reference,
	complete,
	advanced,
	ultimate,
	finalBoss,
	simpleFlat,
	parentReference,
	childReference,
	cyclicFirst,
	cyclicSecond,
	tagged,
	altParent,
	altChildA,
	altChildB,
	deepTop,
	deepMid,
	deepBottom,
	simulation
};

export type LootKey = keyof typeof originalLootTables;
export const lootDataDriven: DataDrivenRegistryElement<MinecraftLootTable>[] = Object.values(originalLootTables);
