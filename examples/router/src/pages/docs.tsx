import { defineRoute, Link, Outlet } from "@voxelio/router";
import { DOCS } from "../docs";

export default function Docs() {
	return (
		<section>
			<h1>Docs</h1>
			<nav>
				{Object.entries(DOCS).map(([slug, title]) => (
					<Link key={slug} to="/docs/$slug" params={{ slug }}>
						{title}
					</Link>
				))}
			</nav>
			<Outlet />
		</section>
	);
}

export const route = defineRoute("/docs", {
	head: () => ({ title: "Docs" }),
	notFound: () => <p id="missing">No such doc</p>
});
