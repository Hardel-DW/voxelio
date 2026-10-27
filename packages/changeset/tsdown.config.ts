import { defineConfig, type UserConfig } from "tsdown";

export default defineConfig({
	entry: ["./src/cli.ts"],
	dts: false,
	format: ["esm"],
	clean: true,
	minify: true,
	sourcemap: false
}) as UserConfig;
