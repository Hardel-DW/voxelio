import { defineRoute } from "@voxelio/router";

export default defineRoute("/", { component: Home, head: () => ({ title: "Home", meta: { description: "The home page" } }) });

function Home() {
	return <h1>Home</h1>;
}
