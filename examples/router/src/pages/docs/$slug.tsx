import { defineRoute, notFound, useParams } from "@voxelio/router";
import { DOCS } from "../../docs";

export default function Doc() {
	const { slug } = useParams();

	return (
		<article>
			<h2 id="doc">{DOCS[slug]}</h2>
			<div className="tall">A tall page, to check the scroll.</div>
			<h3 id="bottom">Bottom</h3>
		</article>
	);
}

export const route = defineRoute("/docs/$slug", {
	beforeLoad: ({ params }) => {
		if (!(params.slug in DOCS)) throw notFound();
	},
	entries: () => Object.keys(DOCS).map((slug) => ({ slug })),
	head: ({ params, pathname }) => ({
		title: `${DOCS[params.slug]} - Docs`,
		meta: { description: `About ${params.slug}`, "og:title": DOCS[params.slug] },
		link: { canonical: `https://example.com${pathname}` }
	})
});
