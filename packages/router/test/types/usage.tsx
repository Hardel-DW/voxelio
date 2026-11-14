import {
	href,
	Link,
	type Manifest,
	navigate,
	Outlet,
	type ParamsOf,
	type RouteConfig,
	type RouteId,
	type RoutePath,
	redirect,
	type SearchFor,
	type SearchOf,
	startRouter,
	type Target,
	useLocation,
	useParams,
	useSearch
} from "@voxelio/router";
import { routes } from "./routes";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Accepts<Path extends RoutePath, Candidate> = Candidate extends Target<Path> ? true : false;
type Context<Id extends RouteId> = Parameters<NonNullable<RouteConfig<Id, {}>["beforeLoad"]>>[0];

const same = <A, B>(_check: Equal<A, B>): void => {};

same<RouteId, "__root" | "/" | "/$lang" | "/$lang/" | "/$lang/posts/$id" | "/journal" | "/files/$">(true);
same<RoutePath, "/" | "/$lang" | "/$lang/posts/$id" | "/journal" | "/files/$">(true);

same<ParamsOf<"/$lang/posts/$id">, { lang: string; id: string }>(true);
same<ParamsOf<"/files/$">, { "*": string }>(true);
same<ParamsOf<"/journal">, {}>(true);
same<ParamsOf<RouteId>, { lang: string; id: string; "*": string }>(true);
same<Context<"/$lang">["params"], { lang: string }>(true);

same<SearchOf<"/journal">, { q: string }>(true);
same<SearchOf<"/$lang">, {}>(true);
same<SearchFor<"/$lang/posts/$id">, { tab: "content" | "comments"; page: number }>(true);
same<SearchFor<"/journal">, { q: string }>(true);

same<Accepts<"/journal", { to: "/journal" }>, true>(true);
same<Accepts<"/journal", { to: "/journal"; params: { lang: string } }>, false>(true);
same<Accepts<"/journal", { to: "/journal"; search: { q: string } }>, true>(true);
same<Accepts<"/journal", { to: "/journal"; search: { q: number } }>, false>(true);
same<Accepts<"/$lang", { to: "/$lang"; params: { lang: string } }>, true>(true);
same<Accepts<"/$lang", { to: "/$lang" }>, false>(true);
same<Accepts<"/$lang", { to: "/$lang"; params: { id: string } }>, false>(true);
same<Accepts<"/$lang/posts/$id", { to: "/$lang/posts/$id"; params: { lang: string; id: string }; search: { tab: "other" } }>, false>(true);
same<"/nope" extends RoutePath ? true : false, false>(true);

const misplaced = { "/journal": () => import("./routes/$lang") };
same<typeof routes extends Manifest<typeof routes> ? true : false, true>(true);
same<typeof misplaced extends Manifest<typeof misplaced> ? true : false, false>(true);

startRouter(routes);
startRouter(routes, { base: "/app", preload: false, parseSearch: (query) => Object.fromEntries(new URLSearchParams(query)) });

navigate({ to: "/" });
navigate({ to: "/journal", search: { q: "x" }, replace: true });
navigate({ to: "/$lang", params: { lang: "fr" }, hash: "top" });
navigate({ to: "/files/$", params: { "*": "a/b.png" } });
href({ to: "/$lang/posts/$id", params: { lang: "fr", id: "1" }, search: { tab: "comments" } });
redirect({ to: "/journal" });

export function Usage() {
	const { lang } = useParams();
	const { q } = useSearch("/journal");
	const pathname = useLocation((location) => location.pathname);

	return (
		<>
			<Outlet />
			<Link to="/" className="home">
				{pathname}
			</Link>
			<Link to="/$lang" params={{ lang }} />
			<Link to="/journal" search={{ q }} />
		</>
	);
}
