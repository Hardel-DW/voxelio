import { defineConfig, type UserConfig } from "tsdown";

export default defineConfig({
	entry: ["./src/index.ts"],
	format: ["esm"],
	dts: true,
	clean: true,
	minify: true,
	sourcemap: false,
	treeshake: true,
	target: "es2022"
}) as UserConfig;
