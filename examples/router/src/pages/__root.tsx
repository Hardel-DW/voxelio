import { defineRoute, Link, Outlet } from "@voxelio/router";

export default function Root() {
	return (
		<>
			<nav>
				<Link to="/">Home</Link>
				<Link to="/docs">Docs</Link>
				<Link to="/journal" search={{ q: "hello" }}>
					Journal
				</Link>
				<Link to="/private">Private</Link>
				<Link to="/crash">Crash</Link>
				<Link to="/files/$" params={{ "*": "a/b.png" }}>
					File
				</Link>
				<a href="/missing">Missing</a>
				<a href="/docs/unknown">Unknown doc</a>
			</nav>
			<input name="kept" placeholder="kept across navigations" />
			<Outlet />
		</>
	);
}

function Crashed({ error }: { error: Error }) {
	return <p id="error">Crashed: {error.message}</p>;
}

export const route = defineRoute("__root", {
	head: () => ({ meta: { "og:site_name": "Router example" } }),
	notFound: () => <p id="missing">Root not found</p>,
	error: Crashed
});
