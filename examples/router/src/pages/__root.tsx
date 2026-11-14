import { defineRoute, type ErrorProps, Link, Outlet } from "@voxelio/router";

export default defineRoute("__root", {
	component: Root,
	head: () => ({ meta: { "og:site_name": "Router example" } }),
	notFound: Missing,
	error: Crashed
});

function Root() {
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

function Missing() {
	return <p id="missing">Root not found</p>;
}

function Crashed({ error }: ErrorProps) {
	return <p id="error">Crashed: {error.message}</p>;
}
