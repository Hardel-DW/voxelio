import react from "@vitejs/plugin-react";
import { router } from "@voxelio/router/vite";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [router({ prerender: true }), react()]
});
