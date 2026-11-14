import type { RegisteredRoutes } from "./types";

function missing(): never {
	throw new Error('"@voxelio/router/routes" is served by the Vite plugin: add router() from "@voxelio/router/vite" to the plugins.');
}

/** The manifest of the routes directory, written by the Vite plugin. */
export const routes: RegisteredRoutes = missing();
