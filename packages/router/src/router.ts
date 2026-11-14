import { type ComponentType, createElement } from "react";
import { flushSync } from "react-dom";
import { applyHead, HEAD_MARK, mergeHead } from "./head";
import { compile, fill, match, type Table } from "./path";
import type {
	Head,
	Location,
	Manifest,
	Params,
	ParamsOf,
	RawSearch,
	RouteId,
	RouteModule,
	RoutePath,
	Routes,
	Search,
	SearchOf,
	Target
} from "./types";

export type RouterOptions = {
	/** Where the application lives, the `base` of Vite unless given. */
	base?: string;
	parseSearch?: (query: string) => RawSearch;
	stringifySearch?: (search: Search) => string;
	/** Loads the chunks behind a link as soon as it is hovered or focused, on unless disabled. */
	preload?: boolean;
};

type Config = RouteModule["default"]["route"];
type Settings = { base: string; parse: (query: string) => RawSearch; stringify: (search: Search) => string };
type Loose = { to: string; params?: Params; search?: object; hash?: string };

export type Match = { id: string; view: ComponentType; route?: Config };
export type State = Location & {
	query: string;
	params: ParamsOf<RouteId>;
	matches: Match[];
	/** The last validated search of each route, kept after it is left so a view on its way out still reads its own. */
	searches: { [Id in RouteId]?: { query: string; value: SearchOf<Id> } };
	head: Head;
};

export class Redirect extends Error {
	constructor(readonly href: string) {
		super(`Redirect to ${href}`);
	}
}

export class NotFound extends Error {}

const INTENTS = ["pointerover", "focusin"];
const EMPTY = {};
const Missing = (): string => "Not found";
const leaf = (view: ComponentType): Match => ({ id: "", view });

const parseSearch = (query: string): RawSearch => Object.fromEntries(new URLSearchParams(query));
const stringifySearch = (search: Search): string => {
	const kept = Object.entries(search).filter(([, value]) => value !== undefined && value !== null && value !== "");
	return new URLSearchParams(kept.map(([key, value]) => [key, String(value)])).toString();
};

const listeners = new Set<() => void>();
const overrides = new Map<string, Config>();
let config: Settings = { base: "", parse: parseSearch, stringify: stringifySearch };
let routes: Routes = {};
let table: Table = compile([]);
let state: State = { pathname: "", search: {}, query: "", params: {}, matches: [], searches: {}, head: {} };
let title = "";
let ticket = 0;
let hinted = "";

export const getState = (): State => state;

export function subscribe(listener: () => void): () => void {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

/** The path inside the application, nothing for a URL that leaves it. */
function locate(url: URL): string | undefined {
	const { base } = config;
	if (url.origin !== location.origin || (url.pathname !== base && !url.pathname.startsWith(`${base}/`))) return;

	return url.pathname.slice(base.length).replace(/\/+$/, "") || "/";
}

function compose(pathname: string, search: object, hash = ""): string {
	const query = config.stringify({ ...search });
	return `${config.base}${pathname}${query && `?${query}`}${hash}`;
}

/** `href` without the registry, for the callers that are generic over the path. */
export const build = ({ to, params, search = EMPTY, hash }: Loose): string => compose(fill(to, params), search, hash && `#${hash}`);

/** A missing page shows in the outlet of the closest route with a `notFound`, an error replaces the closest route with an `error`. */
function recover(kept: Match[], own: Config | undefined, error: Error): Match[] {
	const chain = [...kept.map((match) => match.route), own];

	if (error instanceof NotFound) {
		const host = chain.findLastIndex((route) => route?.notFound);
		return [...kept.slice(0, Math.max(host, 0) + 1), leaf(chain[host]?.notFound ?? Missing)];
	}

	const host = chain.findLastIndex((route) => route?.error);
	const Fallback = chain[host]?.error;
	if (!Fallback) throw error;

	return [...kept.slice(0, host), leaf(() => createElement(Fallback, { error }))];
}

async function resolve(url: URL, pathname: string, cached: boolean): Promise<State> {
	const { ids, params, found } = match(table, pathname);
	const loaded = await Promise.allSettled(ids.map((id) => routes[id]()));
	const heads: Head[] = [];
	const next: State = {
		pathname,
		search: cached && url.search === state.query ? state.search : config.parse(url.search.slice(1)),
		query: url.search,
		params: pathname === state.pathname ? state.params : params,
		matches: [],
		searches: { ...state.searches },
		head: {}
	};

	for (const [position, id] of ids.entries()) {
		const settled = loaded[position];
		const route = settled.status === "fulfilled" ? (overrides.get(id) ?? settled.value.default.route) : undefined;

		try {
			if (settled.status === "rejected") throw settled.reason;

			const known = cached ? state.searches[id] : undefined;
			const search = known?.query === url.search ? known.value : (route?.search?.(next.search) ?? EMPTY);
			await route?.beforeLoad?.({ params, search, pathname });

			next.searches[id] = { query: url.search, value: search };
			next.matches.push({ id, view: settled.value.default, route });
			heads.push(route?.head?.({ params, pathname }) ?? EMPTY);
		} catch (thrown) {
			if (thrown instanceof Redirect) throw thrown;

			const error = thrown instanceof Error ? thrown : new Error(String(thrown));
			return { ...next, matches: recover(next.matches, route, error), head: mergeHead(heads) };
		}
	}

	return { ...next, matches: found ? next.matches : recover(next.matches, undefined, new NotFound()), head: mergeHead(heads) };
}

function commit(next: State): void {
	state = next;
	applyHead(next.head, title);
	for (const listener of listeners) listener();
}

/** Only the latest navigation is shown, a redirect starts over from its target. */
async function go(url: URL, pathname: string, cached = true): Promise<void> {
	const current = ++ticket;

	try {
		const next = await resolve(url, pathname, cached);
		if (current === ticket) flushSync(() => commit(next));
	} catch (thrown) {
		if (!(thrown instanceof Redirect)) throw thrown;
		if (current === ticket) navigation.navigate(thrown.href, { history: "replace" });
	}
}

/** URLs without a page are left to the browser, so files and server routes keep working. */
function onNavigate(event: NavigateEvent): void {
	if (!event.canIntercept || event.hashChange || event.downloadRequest !== null || event.formData) return;
	if (event.navigationType === "reload") return;

	const url = new URL(event.destination.url);
	const pathname = locate(url);
	if (pathname === undefined || !match(table, pathname).found) return;

	const behavior = pathname === state.pathname ? "manual" : "after-transition";
	event.intercept({ focusReset: behavior, scroll: behavior, handler: () => go(url, pathname) });
}

function onIntent(event: Event): void {
	const anchor = event.target instanceof Element ? event.target.closest("a") : null;
	if (!anchor?.href || anchor.href === hinted) return;

	hinted = anchor.href;
	preload(hinted);
}

/** Validates the search and runs the guards again for the current URL, after a login for instance. */
export function refresh(): Promise<void> {
	const url = new URL(location.href);
	return go(url, locate(url) ?? "/", false);
}

function mount(manifest: Routes): Promise<void> {
	routes = manifest;
	table = compile(Object.keys(manifest));
	return refresh();
}

/** Swaps the whole manifest. The Vite plugin calls it when a route file cannot be refreshed in place. */
export function reloadRoutes(manifest: Routes): Promise<void> {
	overrides.clear();
	return mount(manifest);
}

/** Gives a route the config of its edited file. Its view stays, React Refresh updates it in place. Called by the Vite plugin. */
export function reloadRoute(id: string, route: Config): void {
	overrides.set(id, route);
	if (state.matches.some((match) => match.id === id)) refresh();
}

/** Call it once, before rendering `<Outlet />` at the root of the application. */
export function startRouter<const Loaders extends Routes>(manifest: Loaders & Manifest<Loaders>, options: RouterOptions = {}): void {
	const base = options.base ?? import.meta.env.BASE_URL;

	config = {
		base: base.replace(/\/+$/, ""),
		parse: options.parseSearch ?? parseSearch,
		stringify: options.stringifySearch ?? stringifySearch
	};
	title = document.querySelector("title")?.getAttribute(HEAD_MARK) ?? document.title;

	navigation.addEventListener("navigate", onNavigate);
	if (options.preload ?? true) for (const intent of INTENTS) document.addEventListener(intent, onIntent);
	mount(manifest);
}

/** Fetches the chunks of a URL ahead of the navigation. */
export function preload(href: string): void {
	const pathname = locate(new URL(href, location.href));
	if (pathname === undefined) return;

	for (const id of match(table, pathname).ids) routes[id]().catch(() => {});
}

export function href<const Path extends RoutePath>(target: Target<Path>): string {
	return build(target);
}

export function navigate<const Path extends RoutePath>(target: Target<Path> & { replace?: boolean }): void {
	navigation.navigate(build(target), { history: target.replace ? "replace" : "auto" });
}

/** Merges into the search of the current page, `undefined` drops a key. Replaces the history entry unless told otherwise. */
export function patchSearch<Id extends RouteId = RouteId>(patch: Partial<SearchOf<Id>>, options: { replace?: boolean } = {}): void {
	const url = compose(state.pathname, { ...state.search, ...patch }, location.hash);
	navigation.navigate(url, { history: options.replace === false ? "auto" : "replace" });
}

/** `throw redirect({ to: "/login" })` from a `beforeLoad`. */
export function redirect<const Path extends RoutePath>(target: Target<Path>): Redirect {
	return new Redirect(build(target));
}

/** `throw notFound()` from a `beforeLoad`. */
export function notFound(): NotFound {
	return new NotFound();
}
