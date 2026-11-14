import { defineRoute, Outlet } from "@voxelio/router";

export default function Root() {
	return <Outlet />;
}

export const route = defineRoute("__root", { notFound: () => "nothing here", error: ({ error }) => error.message });
