import { defineRoute, Link, useParams, useSearch } from "@voxelio/router";

export default defineRoute("/$lang/posts/$id", {
	component: Post,
	search: (raw): { tab: "content" | "comments"; page: number } => ({
		tab: raw.tab === "comments" ? "comments" : "content",
		page: Number(raw.page ?? 1)
	}),
	beforeLoad: ({ params, search }) => {
		const id: string = params.id;
		const tab: "content" | "comments" = search.tab;
		if (!id || !tab) throw new Error("unreachable");
	}
});

function Post() {
	const { lang, id } = useParams();
	const { tab, page } = useSearch("/$lang/posts/$id");

	return (
		<Link to="/$lang/posts/$id" params={{ lang, id }} search={{ tab, page: page + 1 }}>
			next
		</Link>
	);
}
