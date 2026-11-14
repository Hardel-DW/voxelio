import { defineRoute, notFound, Outlet } from "@voxelio/router";

export default defineRoute("/$lang", {
	component: Outlet,
	beforeLoad: ({ params }) => {
		if (params.lang !== "en") throw notFound();
	},
	entries: () => [{ lang: "en" }, { lang: "fr" }],
	head: ({ params }) => ({ title: params.lang })
});
