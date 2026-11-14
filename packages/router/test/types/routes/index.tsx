import { defineRoute, redirect } from "@voxelio/router";

export default defineRoute("/", {
	component: () => null,
	beforeLoad: () => {
		throw redirect({ to: "/$lang", params: { lang: "en" } });
	}
});
