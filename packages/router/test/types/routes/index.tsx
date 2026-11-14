import { defineRoute, redirect } from "@voxelio/router";

export default function Home() {
	return null;
}

export const route = defineRoute("/", {
	beforeLoad: () => {
		throw redirect({ to: "/$lang", params: { lang: "en" } });
	}
});
