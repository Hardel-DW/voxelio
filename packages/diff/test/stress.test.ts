import { describe, expect, it } from "vitest";
import { Differ } from "../src/differ";

describe("Stress Tests - Highest Complexity", () => {
	it("should handle deeply nested objects with key reordering at every level", () => {
		const before = {
			a: 1,
			b: {
				x: 10,
				y: {
					m: 100,
					n: {
						alpha: 1000,
						beta: {
							one: 10000,
							two: {
								foo: 100000,
								bar: {
									red: 1000000,
									blue: {
										up: 10000000,
										down: {
											left: 100000000,
											right: 1000000000
										}
									}
								}
							}
						}
					}
				}
			},
			c: 3
		};

		const after = {
			c: 3, // Ordre changé (c avant a)
			a: 1,
			b: {
				y: { // Ordre changé (y avant x)
					n: { // Ordre changé (n avant m)
						beta: { // Ordre changé (beta avant alpha)
							two: { // Ordre changé (two avant one)
								bar: { // Ordre changé (bar avant foo)
									blue: { // Ordre changé (blue avant red)
										down: { // Ordre changé (down avant up)
											right: 1000000000, // Ordre changé (right avant left)
											left: 100000000
										},
										up: 10000000
									},
									red: 1000000
								},
								foo: 100000
							},
							one: 10000
						},
						alpha: 1000
					},
					m: 100
				},
				x: 10
			}
		};

		const patch = new Differ(before, after).diff();
		const applied = Differ.apply(before, patch);
		expect(applied).toEqual(after);
		expect(JSON.stringify(applied)).toBe(JSON.stringify(after));
	});

	it("should handle array of objects with mixed operations and key reordering", () => {

		const before = {
			items: [
				{ id: 1, name: "Alice", age: 30, city: "Paris" },
				{ id: 2, name: "Bob", age: 25, city: "London" },
				{ id: 3, name: "Charlie", age: 35, city: "Berlin" },
				{ id: 4, name: "David", age: 28, city: "Madrid" },
				{ id: 5, name: "Eve", age: 32, city: "Rome" }
			]
		};

		const after = {
			items: [
				{ name: "Alice", id: 1, city: "Lyon", age: 31 },
				{ age: 35, city: "Berlin", name: "Charlie", id: 3 },
				{ id: 6, name: "Frank", age: 29, city: "Amsterdam" },
				{ city: "Barcelona", name: "David", id: 4, age: 28 },
				{ id: 7, name: "Grace", age: 27, city: "Vienna" }
			]
		};

		const patch = new Differ(before, after).diff();
		const applied = Differ.apply(before, patch);

		expect(applied).toEqual(after);
		expect(JSON.stringify(applied)).toBe(JSON.stringify(after));
	});

	it("should handle complex nested arrays with objects at multiple depths", () => {

		const before = {
			level1: [
				{
					id: 1,
					level2: [
						{
							id: 2,
							level3: [
								{ a: 1, b: 2, c: 3 },
								{ d: 4, e: 5, f: 6 }
							]
						}
					]
				}
			]
		};

		const after = {
			level1: [
				{
					id: 1,
					level2: [
						{
							id: 2,
							level3: [
								{ c: 3, b: 2, a: 1 }, // Ordre changé
								{ f: 6, e: 5, d: 4 }, // Ordre changé
								{ g: 7, h: 8, i: 9 }  // Ajouté
							]
						},
						{ id: 3, data: "new" } // Ajouté
					]
				},
				{ id: 4, extra: true } // Ajouté à level1
			]
		};

		const patch = new Differ(before, after).diff();
		const applied = Differ.apply(before, patch);

		expect(applied).toEqual(after);
		expect(JSON.stringify(applied)).toBe(JSON.stringify(after));
	});

	it("should handle massive object with add/remove/reorder all at once", () => {

		const before = {
			a: 1, b: 2, c: 3, d: 4, e: 5,
			f: 6, g: 7, h: 8, i: 9, j: 10,
			nested: {
				x: 100, y: 200, z: 300,
				deep: {
					m: 1000, n: 2000, o: 3000
				}
			}
		};

		const after = {
			// Ordre complètement changé
			j: 10, i: 9, h: 8,
			// Supprimés: g, f, e
			d: 4, c: 3,
			// Ajoutés
			k: 11, l: 12,
			b: 2, a: 1,
			nested: {
				// Ordre changé + suppressions + ajouts
				z: 300,
				deep: {
					o: 3000, // Ordre changé
					p: 4000, // Ajouté
					m: 1000
					// Supprimé: n
				},
				x: 100,
				w: 400 // Ajouté
				// Supprimé: y
			}
		};

		const patch = new Differ(before, after).diff();
		const applied = Differ.apply(before, patch);

		expect(applied).toEqual(after);
		expect(JSON.stringify(applied)).toBe(JSON.stringify(after));
	});

	it("should handle arrays with all elements removed and new ones added", () => {

		const before = {
			tags: ["one", "two", "three", "four", "five"],
			numbers: [1, 2, 3, 4, 5]
		};

		const after = {
			tags: ["six", "seven", "eight"],
			numbers: [10, 20, 30, 40, 50, 60]
		};

		const patch = new Differ(before, after).diff();
		const applied = Differ.apply(before, patch);

		expect(applied).toEqual(after);
		expect(JSON.stringify(applied)).toBe(JSON.stringify(after));
	});

	it("should handle empty to full and full to empty transitions", () => {

		const test1Before = { data: [], info: {} };
		const test1After = {
			data: [1, 2, 3, { nested: true }],
			info: { a: 1, b: 2, c: { deep: true } }
		};

		const patch1 = new Differ(test1Before, test1After).diff();
		const applied1 = Differ.apply(test1Before, patch1);
		expect(applied1).toEqual(test1After);

		// Inverse: full to empty
		const patch2 = new Differ(test1After, test1Before).diff();
		const applied2 = Differ.apply(test1After, patch2);
		expect(applied2).toEqual(test1Before);
	});

	it("should handle key order change with same values but different nesting", () => {

		const before = {
			user: {
				profile: {
					firstName: "John",
					lastName: "Doe",
					age: 30,
					address: {
						street: "Main St",
						city: "NYC",
						zip: "10001"
					}
				}
			}
		};

		const after = {
			user: {
				profile: {
					// Ordre complètement inversé
					address: {
						zip: "10001", // Ordre inversé aussi
						city: "NYC",
						street: "Main St"
					},
					age: 30,
					lastName: "Doe",
					firstName: "John"
				}
			}
		};

		const patch = new Differ(before, after).diff();
		const applied = Differ.apply(before, patch);

		expect(applied).toEqual(after);
		expect(JSON.stringify(applied)).toBe(JSON.stringify(after));
	});

	it("should handle special characters in keys with reordering", () => {

		const before = {
			"key/with/slash": 1,
			"key~with~tilde": 2,
			"normal": 3,
			"key with spaces": 4
		};

		const after = {
			"key with spaces": 4,
			"normal": 3,
			"key~with~tilde": 2,
			"key/with/slash": 1
		};

		const patch = new Differ(before, after).diff();
		const applied = Differ.apply(before, patch);

		expect(applied).toEqual(after);
		expect(JSON.stringify(applied)).toBe(JSON.stringify(after));
	});

	it("should handle Minecraft-like ultra complex scenario", () => {

		// Scénario ultra complexe: combinaison de tout
		const before = {
			version: "1.0",
			worldData: {
				chunks: [
					{
						x: 0, z: 0,
						blocks: [
							{ type: "stone", pos: { x: 0, y: 0, z: 0 } },
							{ type: "dirt", pos: { x: 1, y: 0, z: 0 } }
						]
					}
				],
				entities: [
					{ id: 1, type: "player", name: "Steve", inventory: [] }
				]
			},
			settings: {
				render: { distance: 10, fog: true },
				audio: { volume: 0.8, muted: false }
			}
		};

		const after = {
			version: "2.0", // Changé
			settings: { // Ordre changé (settings avant worldData)
				audio: { muted: false, volume: 0.9 }, // Ordre changé + volume changé
				render: { fog: false, distance: 16, quality: "high" }, // Ordre changé + ajout quality
				gamma: 1.0 // Ajouté
			},
			worldData: {
				entities: [ // Ordre changé (entities avant chunks)
					{ id: 1, type: "player", name: "Steve", inventory: [{ id: "diamond_sword" }] }, // inventory changé
					{ id: 2, type: "zombie", name: "Zombie" } // Ajouté
				],
				chunks: [
					{
						z: 0, x: 0, // Ordre changé
						blocks: [
							{ pos: { z: 0, y: 0, x: 0 }, type: "bedrock" }, // Ordre changé + type changé
							{ pos: { z: 0, y: 0, x: 2 }, type: "grass" } // Position changée
							// Supprimé: dirt block
						],
						biome: "plains" // Ajouté
					},
					{ x: 1, z: 0, blocks: [] } // Chunk ajouté
				],
				weather: "rain" // Ajouté
			}
		};

		const patch = new Differ(before, after).diff();
		const applied = Differ.apply(before, patch);

		expect(applied).toEqual(after);
		expect(JSON.stringify(applied)).toBe(JSON.stringify(after));
	});
});
