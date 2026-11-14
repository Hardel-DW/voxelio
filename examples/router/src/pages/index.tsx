import { defineRoute } from "@voxelio/router";

export default function Home() {
	return <h1>Home</h1>;
}

export const route = defineRoute("/", { head: () => ({ title: "Home", meta: { description: "The home page" } }) });
