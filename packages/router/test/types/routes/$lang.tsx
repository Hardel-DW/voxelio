import { defineRoute, notFound, Outlet } from "@voxelio/router";

export default function Lang() {
	return <Outlet />;
}

export const route = defineRoute("/$lang", {
	beforeLoad: ({ params }) => {
		if (params.lang !== "en") throw notFound();
	},
	entries: () => [{ lang: "en" }, { lang: "fr" }],
	head: ({ params }) => ({ title: params.lang })
});
