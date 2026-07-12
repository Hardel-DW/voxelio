import { access, constants, readFile, writeFile } from "node:fs/promises";
import { type } from "arktype";
import { DeployConfig } from "@/type";

const CONFIG_PATH = "deploy.json";

export async function configExists(): Promise<boolean> {
	try {
		await access(CONFIG_PATH, constants.F_OK);
		return true;
	} catch {
		return false;
	}
}

export async function readConfig(): Promise<DeployConfig> {
	const content = await readFile(CONFIG_PATH, "utf-8");
	const config = JSON.parse(content);
	const validation = DeployConfig(config);
	if (validation instanceof type.errors) {
		throw new Error(`Invalid ${CONFIG_PATH}: ${validation.summary}`);
	}

	return validation;
}

export async function writeConfig(config: DeployConfig): Promise<void> {
	const validation = DeployConfig(config);
	if (validation instanceof type.errors) {
		throw new Error(`Invalid config: ${validation.summary}`);
	}

	const content = `${JSON.stringify(config, null, 2)}\n`;
	await writeFile(CONFIG_PATH, content, "utf-8");
}

export function createDefaultConfig(): DeployConfig {
	return {
		project: {
			version: "0.1.0",
			name: "",
			filename: ""
		},
		modrinth: {
			enabled: false,
			project_id: "",
			featured: false
		},
		curseforge: {
			datapack: {
				enabled: false,
				project_id: null
			},
			mod: {
				enabled: false,
				project_id: null,
				java_versions: ["Java 25"],
				environments: ["server"]
			}
		},
		package_as_mod: {
			enabled: false,
			loaders: ["fabric", "forge", "neoforge", "quilt"],
			id: "",
			authors: []
		},
		build: {
			exclude: [".git", ".github", ".changeset", ".vscode", ".cursor", "node_modules", "README.md", ".gitignore", "deploy.json"]
		}
	};
}
