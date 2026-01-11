import { describe, expect, it } from "vitest";
import { createContext } from "@/context";
import { gameRulesRename } from "@/migrations/1.21.11/game-rules-rename";

function applyMcfunction(content: string): string {
	const files: Record<string, Uint8Array> = {
		"data/test/function/test.mcfunction": new TextEncoder().encode(content),
	};
	const ctx = createContext(files, []);
	gameRulesRename.migrate(ctx);
	return new TextDecoder().decode(files["data/test/function/test.mcfunction"]);
}

function applyJson(content: string): unknown {
	const files: Record<string, Uint8Array> = {
		"data/test/test_environment/test.json": new TextEncoder().encode(content),
	};
	const ctx = createContext(files, []);
	gameRulesRename.migrate(ctx);
	return JSON.parse(new TextDecoder().decode(files["data/test/test_environment/test.json"]));
}

describe("gameRulesRename - mcfunction", () => {
	it("should rename simple gamerule command", () => {
		expect(applyMcfunction("gamerule doDaylightCycle false")).toBe("gamerule minecraft:advance_time false");
	});

	it("should invert disableRaids value", () => {
		expect(applyMcfunction("gamerule disableRaids true")).toBe("gamerule minecraft:raids false");
		expect(applyMcfunction("gamerule disableRaids false")).toBe("gamerule minecraft:raids true");
	});

	it("should handle doFireTick special case", () => {
		expect(applyMcfunction("gamerule doFireTick false")).toBe("gamerule minecraft:fire_spread_radius_around_player 0");
		expect(applyMcfunction("gamerule doFireTick true")).toBe("gamerule minecraft:fire_spread_radius_around_player 128");
	});

	it("should not modify unrelated commands", () => {
		expect(applyMcfunction("say hello world")).toBe("say hello world");
	});
});

describe("gameRulesRename - test environment JSON", () => {
	it("should convert game_rules type with bool_rules and int_rules", () => {
		const input = JSON.stringify({
			type: "minecraft:game_rules",
			bool_rules: [{ rule: "doDaylightCycle", value: false }],
			int_rules: [{ rule: "randomTickSpeed", value: 10 }],
		});
		const result = applyJson(input) as { type: string; rules: Record<string, unknown> };

		expect(result.type).toBe("minecraft:game_rules");
		expect(result.rules["minecraft:advance_time"]).toBe(false);
		expect(result.rules["minecraft:random_tick_speed"]).toBe(10);
	});

	it("should handle nested game_rules in all_of definitions", () => {
		const input = JSON.stringify({
			type: "minecraft:all_of",
			definitions: [
				{
					type: "minecraft:game_rules",
					bool_rules: [{ rule: "doMobSpawning", value: true }],
				},
			],
		});
		const result = applyJson(input) as { definitions: Array<{ rules: Record<string, unknown> }> };

		expect(result.definitions[0].rules["minecraft:spawn_mobs"]).toBe(true);
	});

	it("should invert inverted rules in JSON", () => {
		const input = JSON.stringify({
			type: "minecraft:game_rules",
			bool_rules: [{ rule: "disableRaids", value: true }],
		});
		const result = applyJson(input) as { rules: Record<string, unknown> };

		expect(result.rules["minecraft:raids"]).toBe(false);
	});
});
