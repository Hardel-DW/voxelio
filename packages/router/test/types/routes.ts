export const routes = {
	__root: () => import("./routes/__root"),
	"/": () => import("./routes/index"),
	"/$lang": () => import("./routes/$lang"),
	"/$lang/": () => import("./routes/$lang/index"),
	"/$lang/posts/$id": () => import("./routes/$lang/posts/$id"),
	"/journal": () => import("./routes/journal"),
	"/files/$": () => import("./routes/files/$")
};

declare module "@voxelio/router" {
	interface Register {
		routes: typeof routes;
	}
}
