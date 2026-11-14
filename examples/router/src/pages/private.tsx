import { defineRoute, redirect } from "@voxelio/router";

export default function Private() {
	return <h1>Private</h1>;
}

export const route = defineRoute("/private", {
	beforeLoad: () => {
		throw redirect({ to: "/journal", search: { q: "redirected" } });
	}
});
