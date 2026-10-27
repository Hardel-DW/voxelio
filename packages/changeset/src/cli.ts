#!/usr/bin/env node
import { add } from "@/commands/add";
import { publish } from "@/commands/publish";
import { version } from "@/commands/version";

const commands: Record<string, (root: string) => Promise<void>> = {
	add,
	version: async (root) => {
		await version(root);
	},
	publish: async (root) => {
		if (!(await publish(root))) process.exitCode = 1;
	}
};

const name = process.argv[2] ?? "add";
const command = commands[name];

try {
	if (!command) throw new Error(`Unknown command "${name}", expected add, version or publish`);
	await command(process.cwd());
} catch (error) {
	console.error(error instanceof Error ? error.message : error);
	process.exitCode = 1;
}
