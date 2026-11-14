import { defineRoute, patchSearch } from "@voxelio/router";

export default function Journal() {
	return (
		<button type="button" onClick={() => patchSearch<"/journal">({ q: "hello" })} onBlur={() => patchSearch({ q: undefined })}>
			search
		</button>
	);
}

export const route = defineRoute("/journal", { search: (raw) => ({ q: raw.q ?? "" }) });
