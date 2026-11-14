import { defineRoute, redirect } from "@voxelio/router";

export default defineRoute("/private", {
	component: Private,
	beforeLoad: () => {
		throw redirect({ to: "/journal", search: { q: "redirected" } });
	}
});

function Private() {
	return <h1>Private</h1>;
}
