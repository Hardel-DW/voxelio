import { defineRoute } from "@voxelio/router";

export default defineRoute("/crash", {
	component: Crash,
	beforeLoad: async () => {
		throw new Error("the guard failed");
	}
});

function Crash() {
	return <h1>Crash</h1>;
}
