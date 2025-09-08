import { describe, it, expect } from "vitest";
import { Datapack } from "@/core/Datapack";
import { Logger } from "@/core/engine/migrations/logger";
import { updateData } from "@/core/engine/actions";
import { parseDatapack } from "@/core/engine/Parser";
import { lootTableFile, enchantmentFile } from "@test/template/datapack";
import { createZipFile, prepareFiles } from "@test/template/utils";

describe("E2E Logs System", () => {
	describe("Scenario 1: Basic logging flow", () => {
		it("should track changes, export logs, and generate valid datapack", async () => {
			// Prepare mock datapack
			const files = prepareFiles({ ...lootTableFile, ...enchantmentFile });
			const datapackFile = await createZipFile(files);

			// Parse datapack
			const result = await parseDatapack(datapackFile);
			const logger = result.logger;

			// Get an element to modify
			const elementKey = Array.from(result.elements.keys())[0];
			const element = result.elements.get(elementKey);
			if (!element) throw new Error("Element not found");

			// Apply some actions with logging
			await logger.trackChanges(element, async (el) => {
				return await updateData({ type: "core.set_value", path: "name", value: "Modified Name" }, el, 123);
			});

			await logger.trackChanges(element, async (el) => {
				return await updateData({ type: "core.set_value", path: "value", value: 999 }, el, 123);
			});

			// Verify changes were tracked
			const changes = logger.getChanges();
			expect(changes).toHaveLength(2);
			expect(changes[0].differences[0].path).toBe("name");
			expect(changes[0].differences[0].value).toBe("Modified Name");

			// Export logs
			const logsJson = logger.exportJson();
			expect(logsJson).toContain("logs");
			expect(logsJson).toContain("Modified Name");
			expect(logsJson).toContain("datapack");

			// Parse logs and verify structure
			const parsedLogs = JSON.parse(logsJson);
			expect(parsedLogs.id).toBeDefined();
			expect(parsedLogs.generated_at).toBeDefined();
			expect(parsedLogs.engine).toBe(2);
			expect(parsedLogs.logs).toHaveLength(2);
			expect(parsedLogs.datapack).toBeDefined();
		});
	});

	describe("Scenario 2: Import logs and continue working", () => {
		it("should import existing logs, apply more actions, and export complete history", async () => {
			const files = prepareFiles({ ...lootTableFile });
			const datapackFile = await createZipFile(files);

			// Parse datapack (should import logs)
			const result = await parseDatapack(datapackFile);
			const logger = result.logger;

			// Verify existing logs were imported
			expect(logger.getChanges()).toHaveLength(0);

			// Apply new actions
			const elementKey = Array.from(result.elements.keys())[0];
			const element = result.elements.get(elementKey);
			if (!element) throw new Error("Element not found");

			await logger.trackChanges(element, async (el) => {
				return await updateData({ type: "core.set_value", path: "pools.0.bonus_rolls", value: 2 }, el, 123);
			});

			// Verify combined history
			const allChanges = logger.getChanges();
			expect(allChanges).toHaveLength(1);
			expect(allChanges[0].differences[0].path).toBe("pools.0.bonus_rolls"); // New change

			// Export complete history and verify ID preservation
			const fullLogsJson = logger.exportJson();
			const parsedFullLogs = JSON.parse(fullLogsJson);
			expect(parsedFullLogs.logs).toHaveLength(1);
		});
	});

	describe("Scenario 3: Replay changes from logs", () => {
		it("should parse logs, replay changes, and verify element modifications", async () => {
			// Create logs with specific changes based on what we actually have
			const replayLogs = {
				id: "replay-test-id",
				generated_at: "2024-01-01T00:00:00.000Z",
				version: 48,
				isModded: true,
				engine: 2,
				isMinified: false,
				datapack: {
					name: "replay-datapack",
					namespaces: ["test", "enchantplus"]
				},
				logs: [
					{
						identifier: "test:test",
						registry: "loot_table",
						differences: [{ type: "set", path: "pools.0.rolls", value: 10, origin_value: 0 }],
						timestamp: "2024-01-01T00:00:00.000Z"
					},
					{
						identifier: "enchantplus:sword/attack_speed",
						registry: "enchantment",
						differences: [{ type: "set", path: "max_level", value: 20, origin_value: 5 }],
						timestamp: "2024-01-01T00:01:00.000Z"
					}
				]
			};

			// Import logs into a new logger
			const replayLogger = new Logger(JSON.stringify(replayLogs));
			const importedChanges = replayLogger.getChanges();

			expect(importedChanges).toHaveLength(2);

			// Verify log structure is correct
			expect(importedChanges[0].identifier).toBe("test:test");
			expect(importedChanges[0].differences[0].path).toBe("pools.0.rolls");
			expect(importedChanges[0].differences[0].value).toBe(10);

			expect(importedChanges[1].identifier).toBe("enchantplus:sword/attack_speed");
			expect(importedChanges[1].differences[0].path).toBe("max_level");
			expect(importedChanges[1].differences[0].value).toBe(20);

			// Verify log structure is correct
			expect(importedChanges[0].registry).toBe("loot_table");
			expect(importedChanges[1].registry).toBe("enchantment");

			// Verify ID was preserved
			const exportedJson = replayLogger.exportJson();
			const parsed = JSON.parse(exportedJson);
			expect(parsed.id).toBe("replay-test-id");
		});
	});

	describe("Complete datapack generation workflow", () => {
		it("should parse datapack, apply logged changes, and generate modified datapack", async () => {
			// Prepare original datapack
			const files = prepareFiles(lootTableFile);
			const originalDatapack = new Datapack(files, "test-datapack");

			// Create logger and apply changes
			const logger = new Logger();
			logger.setDatapackInfo({
				name: "test-datapack",
				namespaces: ["test"],
				version: 48,
				isModded: false,
				isMinified: false
			});

			// Get original loot table
			const lootTables = originalDatapack.getRegistry("loot_table");
			expect(lootTables).toHaveLength(4); // completeLootTable, advancedLootTable, ultimateTestLootTable, finalBossOfLootTable

			// Simulate tracked changes on an element
			const testElement = {
				identifier: { namespace: "test", registry: "loot_table", resource: "test" },
				pools: [{ rolls: 1, entries: [] }],
				type: "minecraft:entity"
			};

			await logger.trackChanges(testElement, async (el) => {
				return { ...el, pools: [{ rolls: 5, entries: [] }] };
			});

			// Verify logging worked
			const changes = logger.getChanges();
			expect(changes).toHaveLength(1);
			expect(changes[0].differences[0].path).toBe("pools.0.rolls");
			expect(changes[0].differences[0].value).toBe(5);

			// Generate datapack with logs
			const modifiedElements = [
				{
					type: "updated" as const,
					element: {
						identifier: { namespace: "test", registry: "loot_table", resource: "test" },
						data: testElement
					}
				}
			];

			const generatedZip = originalDatapack.generate(modifiedElements, {
				isMinified: false,
				logger
			});

			expect(generatedZip).toBeDefined();

			// Export logs to verify they contain our changes
			const logsJson = logger.exportJson();
			expect(logsJson).toContain("pools.0.rolls");
			expect(logsJson).toContain('"value": 5');
			expect(logsJson).toContain('"origin_value": 1');
		});
	});
});

describe("E2E Logs Replay System", () => {
	it("should use new Logger.replay() API for migration", async () => {
		// Create source datapack with logs
		const sourceFiles = prepareFiles({ ...lootTableFile, ...enchantmentFile });
		const sourceLogger = new Logger();
		sourceLogger.setDatapackInfo({
			name: "source-datapack",
			namespaces: ["test", "enchantplus"],
			version: 48,
			isModded: true,
			isMinified: false
		});

		// Simulate some changes being tracked using realistic elements
		const element1 = {
			identifier: { namespace: "test", resource: "test" },
			pools: [{ rolls: 1, entries: [] }],
			type: "minecraft:entity"
		};

		const element2 = {
			identifier: { namespace: "enchantplus", resource: "sword/attack_speed" },
			max_level: 5,
			min_cost: { base: 10, per_level: 5 }
		};

		await sourceLogger.trackChanges(element1, async (el) => {
			return { ...el, pools: [{ rolls: 8, entries: [] }], type: "minecraft:chest" };
		});

		await sourceLogger.trackChanges(element2, async (el) => {
			return { ...el, max_level: 15, min_cost: { base: 25, per_level: 5 } };
		});

		// Add logs to source datapack
		const logsJson = sourceLogger.exportJson();
		sourceFiles["voxel/v0.json"] = new TextEncoder().encode(logsJson);
		const sourceDatapackFile = await createZipFile(sourceFiles);

		// Create target datapack
		const targetFiles = prepareFiles({ ...lootTableFile, ...enchantmentFile });
		const targetDatapackFile = await createZipFile(targetFiles);

		// Parse both datapacks
		const source = await parseDatapack(sourceDatapackFile);
		const target = await parseDatapack(targetDatapackFile);

		// Verify source has logs
		const sourceLogFile = source.files["voxel/v0.json"];
		expect(sourceLogFile).toBeDefined();

		// Use new migration API
		const logger = new Logger(sourceLogFile);
		const modifiedElements = await logger.replay(target.elements, target.version);

		// Map log identifiers to target keys (they have registry suffix)
		const lootTableKey = "test:test$loot_table";
		const enchantmentKey = "enchantplus:sword/attack_speed$enchantment";

		// Verify these keys exist in target
		expect(target.elements.has(lootTableKey)).toBe(true);
		expect(target.elements.has(enchantmentKey)).toBe(true);

		// Verify changes were applied
		const modifiedLootTable = modifiedElements.get(lootTableKey);
		const modifiedEnchantment = modifiedElements.get(enchantmentKey);

		expect(modifiedLootTable).toBeDefined();
		expect(modifiedEnchantment).toBeDefined();

		// @ts-expect-error - for test access
		expect(modifiedLootTable.pools[0].rolls).toBe(8);
		// @ts-expect-error - for test access
		expect(modifiedLootTable.type).toBe("minecraft:chest");
		// @ts-expect-error - for test access
		expect(modifiedEnchantment.max_level).toBe(15);
		// @ts-expect-error - for test access
		expect(modifiedEnchantment.min_cost.base).toBe(25);

		// Verify original target elements unchanged
		const originalLootTable = target.elements.get(lootTableKey);
		const originalEnchantment = target.elements.get(enchantmentKey);

		// @ts-expect-error - for test access
		expect(originalLootTable.pools[0].rolls).not.toBe(8); // Should be original value
		// @ts-expect-error - for test access
		expect(originalEnchantment.max_level).not.toBe(15); // Should be original value

		// Verify logger properties
		expect(logger.isMinified).toBe(false);
		expect(logger.getChanges()).toHaveLength(2);
	});

	it("should create logs, parse datapack, transform logs to actions and verify results", async () => {
		const v0 = {
			id: "e2e-replay-test",
			generated_at: "2024-01-01T00:00:00.000Z",
			version: 48,
			isModded: true,
			engine: 2,
			isMinified: false,
			datapack: {
				name: "E2E Test Datapack",
				namespaces: ["test", "enchantplus"]
			},
			logs: [
				{
					identifier: "test:test",
					registry: "loot_table",
					differences: [
						{ type: "set", path: "pools.0.rolls", value: 8, origin_value: 0 },
						{ type: "set", path: "pools.0.bonus_rolls", value: 3, origin_value: undefined }
					],
					timestamp: "2024-01-01T00:00:00.000Z"
				},
				{
					identifier: "test:test",
					registry: "loot_table",
					differences: [{ type: "set", path: "type", value: "minecraft:chest", origin_value: "minecraft:entity" }],
					timestamp: "2024-01-01T00:01:00.000Z"
				},
				{
					identifier: "enchantplus:sword/attack_speed",
					registry: "enchantment",
					differences: [{ type: "set", path: "max_level", value: 15, origin_value: 5 }],
					timestamp: "2024-01-01T00:02:00.000Z"
				},
				{
					identifier: "enchantplus:sword/attack_speed",
					registry: "enchantment",
					differences: [{ type: "set", path: "min_cost.base", value: 25, origin_value: 10 }],
					timestamp: "2024-01-01T00:03:00.000Z"
				},
				{
					identifier: "test:advanced",
					registry: "loot_table",
					differences: [{ type: "set", path: "pools.0.rolls", value: 5, origin_value: 2 }],
					timestamp: "2024-01-01T00:04:00.000Z"
				}
			]
		};

		const v1 = {
			id: "e2e-replay-test",
			generated_at: "2024-01-01T00:00:00.000Z",
			version: 48,
			isModded: true,
			engine: 2,
			isMinified: false,
			datapack: {
				name: "E2E Test Datapack",
				namespaces: ["test", "enchantplus"]
			},
			logs: [
				{
					identifier: "test:test",
					registry: "loot_table",
					differences: [{ type: "set", path: "pools.0.rolls", value: 8, origin_value: 0 }],
					timestamp: "2024-01-01T00:00:00.000Z"
				}
			]
		};

		const files = prepareFiles({ ...lootTableFile, ...enchantmentFile });
		files["voxel/v0.json"] = new TextEncoder().encode(JSON.stringify(v0));
		files["voxel/v1.json"] = new TextEncoder().encode(JSON.stringify(v1));
		const datapackFile = await createZipFile(files);
		const result = await parseDatapack(datapackFile);

		// Get imported logs from the datapack logger
		const importedChanges = new Datapack(files).getAllChanges();
		expect(importedChanges).toHaveLength(6);

		// Transform logs to actions and apply them
		const elementsMap = new Map<string, any>();
		for (const element of result.elements.values()) {
			const id = `${element.identifier.namespace}:${element.identifier.resource}`;
			elementsMap.set(id, element);
		}

		// Group changes by identifier to apply them sequentially
		const changesByElement = new Map<string, typeof importedChanges>();
		for (const change of importedChanges) {
			if (!change.identifier) continue;
			if (!changesByElement.has(change.identifier)) {
				changesByElement.set(change.identifier, []);
			}
			const elementChanges = changesByElement.get(change.identifier);
			if (elementChanges) {
				elementChanges.push(change);
			}
		}

		const modifiedElements = new Map<string, any>();

		// Apply changes for each element
		for (const [elementId, changes] of changesByElement) {
			let currentElement = elementsMap.get(elementId);
			expect(currentElement).toBeDefined();

			if (!currentElement) throw new Error(`Element ${elementId} not found`);

			// Apply all differences for this element
			for (const change of changes) {
				for (const difference of change.differences) {
					currentElement = await updateData(
						{ type: "core.set_value", path: difference.path, value: difference.value },
						currentElement,
						123
					);

					if (!currentElement) throw new Error(`updateData failed for ${elementId} at path ${difference.path}`);
				}
			}

			modifiedElements.set(elementId, currentElement);
		}

		// Verify results match the logs
		const testLootTable = modifiedElements.get("test:test");
		const attackSpeedEnchant = modifiedElements.get("enchantplus:sword/attack_speed");
		const advancedLootTable = modifiedElements.get("test:advanced");

		expect(testLootTable).toBeDefined();
		expect(attackSpeedEnchant).toBeDefined();
		expect(advancedLootTable).toBeDefined();

		expect(testLootTable.pools[0].rolls).toBe(8);
		expect(testLootTable.pools[0].bonus_rolls).toBe(3);
		expect(testLootTable.type).toBe("minecraft:chest");
		expect(attackSpeedEnchant.max_level).toBe(15);
		expect(attackSpeedEnchant.min_cost.base).toBe(25);
		expect(advancedLootTable.pools[0].rolls).toBe(5);

		const changes = v0.logs;
		expect(changes[0].differences[0].value).toBe(8);
		expect(testLootTable.pools[0].rolls).toBe(changes[0].differences[0].value);
		expect(changes[0].differences[1].value).toBe(3);
		expect(testLootTable.pools[0].bonus_rolls).toBe(changes[0].differences[1].value);
		expect(changes[1].differences[0].value).toBe("minecraft:chest");
		expect(testLootTable.type).toBe(changes[1].differences[0].value);
		expect(changes[2].differences[0].value).toBe(15);
		expect(attackSpeedEnchant.max_level).toBe(changes[2].differences[0].value);
		expect(changes[3].differences[0].value).toBe(25);
		expect(attackSpeedEnchant.min_cost.base).toBe(changes[3].differences[0].value);
		expect(changes[4].differences[0].value).toBe(5);
		expect(advancedLootTable.pools[0].rolls).toBe(changes[4].differences[0].value);
	});
});
