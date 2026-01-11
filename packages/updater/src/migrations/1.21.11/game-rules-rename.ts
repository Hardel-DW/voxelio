import type { Migration } from "@/types";
import { isCommand } from "@/utils/command";

const GAMERULE_RENAMES: Record<string, string> = {
	allowEnteringNetherUsingPortals: "minecraft:allow_entering_nether_using_portals",
	announceAdvancements: "minecraft:show_advancement_messages",
	blockExplosionDropDecay: "minecraft:block_explosion_drop_decay",
	commandBlockOutput: "minecraft:command_block_output",
	commandBlocksEnabled: "minecraft:command_blocks_work",
	commandModificationBlockLimit: "minecraft:max_block_modifications",
	disableElytraMovementCheck: "minecraft:elytra_movement_check",
	disablePlayerMovementCheck: "minecraft:player_movement_check",
	disableRaids: "minecraft:raids",
	doDaylightCycle: "minecraft:advance_time",
	doEntityDrops: "minecraft:entity_drops",
	doImmediateRespawn: "minecraft:immediate_respawn",
	doInsomnia: "minecraft:spawn_phantoms",
	doLimitedCrafting: "minecraft:limited_crafting",
	doMobLoot: "minecraft:mob_drops",
	doMobSpawning: "minecraft:spawn_mobs",
	doPatrolSpawning: "minecraft:spawn_patrols",
	doTileDrops: "minecraft:block_drops",
	doTraderSpawning: "minecraft:spawn_wandering_traders",
	doVinesSpread: "minecraft:spread_vines",
	doWardenSpawning: "minecraft:spawn_wardens",
	doWeatherCycle: "minecraft:advance_weather",
	drowningDamage: "minecraft:drowning_damage",
	enderPearlsVanishOnDeath: "minecraft:ender_pearls_vanish_on_death",
	fallDamage: "minecraft:fall_damage",
	fireDamage: "minecraft:fire_damage",
	forgiveDeadPlayers: "minecraft:forgive_dead_players",
	freezeDamage: "minecraft:freeze_damage",
	globalSoundEvents: "minecraft:global_sound_events",
	keepInventory: "minecraft:keep_inventory",
	lavaSourceConversion: "minecraft:lava_source_conversion",
	locatorBar: "minecraft:locator_bar",
	logAdminCommands: "minecraft:log_admin_commands",
	maxCommandChainLength: "minecraft:max_command_sequence_length",
	maxCommandForkCount: "minecraft:max_command_forks",
	maxEntityCramming: "minecraft:max_entity_cramming",
	minecartMaxSpeed: "minecraft:max_minecart_speed",
	mobExplosionDropDecay: "minecraft:mob_explosion_drop_decay",
	mobGriefing: "minecraft:mob_griefing",
	naturalRegeneration: "minecraft:natural_health_regeneration",
	playersNetherPortalCreativeDelay: "minecraft:players_nether_portal_creative_delay",
	playersNetherPortalDefaultDelay: "minecraft:players_nether_portal_default_delay",
	playersSleepingPercentage: "minecraft:players_sleeping_percentage",
	projectilesCanBreakBlocks: "minecraft:projectiles_can_break_blocks",
	pvp: "minecraft:pvp",
	randomTickSpeed: "minecraft:random_tick_speed",
	reducedDebugInfo: "minecraft:reduced_debug_info",
	sendCommandFeedback: "minecraft:send_command_feedback",
	showDeathMessages: "minecraft:show_death_messages",
	snowAccumulationHeight: "minecraft:max_snow_accumulation_height",
	spawnMonsters: "minecraft:spawn_monsters",
	spawnRadius: "minecraft:respawn_radius",
	spawnerBlocksEnabled: "minecraft:spawner_blocks_work",
	spectatorsGenerateChunks: "minecraft:spectators_generate_chunks",
	tntExplodes: "minecraft:tnt_explodes",
	tntExplosionDropDecay: "minecraft:tnt_explosion_drop_decay",
	universalAnger: "minecraft:universal_anger",
	waterSourceConversion: "minecraft:water_source_conversion",
};

const INVERTED_RULES = new Set([
	"disableElytraMovementCheck",
	"disablePlayerMovementCheck",
	"disableRaids",
]);

export const gameRulesRename: Migration = {
	id: "1.21.11/game-rules-rename",
	description: "Rename game rules to snake_case resource locations",
	migrate(ctx) {
		ctx.transform(/\.mcfunction$/, (content) => {
			const lines = content.split("\n");
			let changed = false;

			const newLines = lines.map((line) => {
				const result = processCommand(line);
				if (result !== line) changed = true;
				return result;
			});

			return changed ? newLines.join("\n") : undefined;
		});

		ctx.transform(/\.json$/, (content) => {
			const data = JSON.parse(content);
			const result = processTestEnvironment(data);
			return result.changed ? JSON.stringify(result.data, null, 2) : undefined;
		});
	},
};

function processCommand(line: string): string {
	if (!isCommand(line, "gamerule")) return line;
	if (line.includes("doFireTick false")) return line.replace(/doFireTick\s+false/, "minecraft:fire_spread_radius_around_player 0");
	if (line.includes("doFireTick true")) return line.replace(/doFireTick\s+true/, "minecraft:fire_spread_radius_around_player 128");
	if (line.includes("allowFireTicksAwayFromPlayer true")) return line.replace(/allowFireTicksAwayFromPlayer\s+true/, "minecraft:fire_spread_radius_around_player -1");
	if (line.includes("allowFireTicksAwayFromPlayer false")) return line.replace(/allowFireTicksAwayFromPlayer\s+false/, "minecraft:fire_spread_radius_around_player 128");

	for (const rule of INVERTED_RULES) {
		if (!line.includes(rule)) continue;
		const newName = GAMERULE_RENAMES[rule];
		return line
			.replace(new RegExp(`${rule}\\s+true`, "g"), `${newName} false`)
			.replace(new RegExp(`${rule}\\s+false`, "g"), `${newName} true`)
			.replace(new RegExp(`${rule}(?!\\s+(true|false))`, "g"), newName);
	}

	for (const [oldName, newName] of Object.entries(GAMERULE_RENAMES)) {
		if (!line.includes(oldName)) continue;
		return line.replace(new RegExp(oldName, "g"), newName);
	}

	return line;
}

interface GameRulesEntry {
	rule: string;
	value: boolean | number;
}

interface TestEnvironmentData {
	type?: string;
	bool_rules?: GameRulesEntry[];
	int_rules?: GameRulesEntry[];
	definitions?: TestEnvironmentData[];
	[key: string]: unknown;
}

function processTestEnvironment(data: unknown): { data: unknown; changed: boolean } {
	if (Array.isArray(data)) {
		let changed = false;
		const newArray = data.map((item) => {
			const result = processTestEnvironment(item);
			if (result.changed) changed = true;
			return result.data;
		});
		return { data: newArray, changed };
	}

	if (data === null || typeof data !== "object") {
		return { data, changed: false };
	}

	const obj = data as TestEnvironmentData;
	let changed = false;
	const newObj: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(obj)) {
		const result = processTestEnvironment(value);
		if (result.changed) changed = true;
		newObj[key] = result.data;
	}

	if (obj.type !== "minecraft:game_rules" || (!obj.bool_rules && !obj.int_rules)) {
		return { data: newObj, changed };
	}

	const rules: Record<string, boolean | number> = {};

	for (const entry of obj.bool_rules ?? []) {
		const newKey = GAMERULE_RENAMES[entry.rule] ?? entry.rule;
		const value = INVERTED_RULES.has(entry.rule) ? !entry.value : entry.value;
		rules[newKey] = value;
	}

	for (const entry of obj.int_rules ?? []) {
		const newKey = GAMERULE_RENAMES[entry.rule] ?? entry.rule;
		rules[newKey] = entry.value;
	}

	return {
		data: { type: obj.type, rules },
		changed: true,
	};
}
