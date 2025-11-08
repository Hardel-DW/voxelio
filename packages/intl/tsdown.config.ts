import { defineConfig, type UserConfig } from "tsdown";

export default defineConfig({
	entry: ["./src/index.ts", "./src/runtime.ts"],
	format: ["esm"],
	dts: true,
	clean: true,
	minify: true,
	sourcemap: false,
	treeshake: true,
	target: "es2022",
	external: ["oxc-parser", "@oxc-project/types"]
}) as UserConfig;
