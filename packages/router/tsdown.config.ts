import { defineConfig, type UserConfig } from "tsdown";

export default defineConfig({
	entry: ["./src/index.ts", "./src/routes.ts", "./src/vite.ts", "./src/cli.ts"],
	format: ["esm"],
	dts: true,
	clean: true,
	minify: true,
	sourcemap: false,
	treeshake: true,
	target: "es2024"
}) as UserConfig;
