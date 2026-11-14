import { defineRoute, patchSearch, useSearch } from "@voxelio/router";

export default defineRoute("/journal", { component: Journal, search: (raw) => ({ q: raw.q ?? "" }) });

function Journal() {
	const { q } = useSearch("/journal");

	return (
		<button type="button" onClick={() => patchSearch<"/journal">({ q: `${q}!` })} onBlur={() => patchSearch({ q: undefined })}>
			search
		</button>
	);
}
