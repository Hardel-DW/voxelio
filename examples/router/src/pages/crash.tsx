import { defineRoute } from "@voxelio/router";

export default function Crash() {
	return <h1>Crash</h1>;
}

export const route = defineRoute("/crash", {
	beforeLoad: async () => {
		throw new Error("the guard failed");
	}
});
