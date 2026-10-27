import { resolve } from "node:path";
import { defineConfig, type ViteUserConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@": resolve(import.meta.dirname, "./src"),
			"@test": resolve(import.meta.dirname, "./test")
		}
	}
}) as ViteUserConfig;
