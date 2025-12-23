import { defineConfig, type UserConfig } from "tsdown";

export default defineConfig({
	entry: ["./src/index.ts", "./src/cli.ts"],
	format: ["esm"],
	dts: true,
	clean: true,
	minify: true,
	sourcemap: false
}) as UserConfig;
