import { defineRoute, patchSearch, useSearch } from "@voxelio/router";

export default function Journal() {
	const { q, page } = useSearch("/journal");

	return (
		<section>
			<h1>Journal</h1>
			<input id="q" defaultValue={q} onInput={(event) => patchSearch<"/journal">({ q: event.currentTarget.value })} />
			<button id="next" type="button" onClick={() => patchSearch<"/journal">({ page: page + 1 }, { replace: false })}>
				Next page
			</button>
			<p id="search">
				q={q} page={page}
			</p>
		</section>
	);
}

export const route = defineRoute("/journal", {
	search: (raw) => ({ q: raw.q ?? "", page: Number(raw.page ?? 1) }),
	head: () => ({ title: "Journal" })
});
