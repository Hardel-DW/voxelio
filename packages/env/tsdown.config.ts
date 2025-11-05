import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["./src/index.ts", "./src/config.ts"],
	format: ["esm"],
	dts: true,
	clean: true,
	minify: true,
	sourcemap: false,
	treeshake: true,
	target: "es2022"
});
