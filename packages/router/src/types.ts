import type { ComponentType } from "react";

/**
 * Filled by the Vite plugin, or by hand: `interface Register { routes: typeof routes }`.
 * A `search` key types what a custom `parseSearch` hands to the validators.
 */
export interface Register {}
type Registered<Key extends string, Fallback> = Register extends Record<Key, infer Value> ? Value : Fallback;
type Simplify<Shape> = { [Key in keyof Shape]: Shape[Key] };

export type Params = Record<string, string>;
export type SearchValue = string | number | boolean | null | undefined | SearchValue[] | { [key: string]: SearchValue };
export type Search = Record<string, SearchValue>;
export type RawSearch = Registered<"search", Partial<Record<string, string>>>;
export type Head = { title?: string; meta?: Record<string, string>; link?: Record<string, string> };
export type ErrorProps = { error: Error };
export type Location = { pathname: string; search: RawSearch };

type Splat<Name extends string> = Name extends "" ? "*" : Name;
type ParamName<Path extends string> = Path extends `${string}/$${infer Rest}`
	? Rest extends `${infer Name}/${infer Tail}`
		? Splat<Name> | ParamName<`/${Tail}`>
		: Splat<Rest>
	: never;

/** The params of a path, or of every path of a union at once. */
export type ParamsOf<Path extends string> = string extends Path ? Params : { [Name in ParamName<Path>]: string };
export type RouteConfig<Id extends string, Query extends Search> = {
	/** Turns the raw query into the typed search of this route. */
	search?(raw: RawSearch): Query;
	/** Runs before the route is shown, parents first. Throw `redirect()` or `notFound()` to leave. */
	beforeLoad?(context: { params: ParamsOf<Id>; search: Query; pathname: string }): void | Promise<void>;
	/** Document head, merged over the parents' one. Pure, so the plugin can prerender it. */
	head?(context: { params: ParamsOf<Id>; pathname: string }): Head;
	/** Values of the params to prerender, combined with the ones of the parents. */
	entries?(): Partial<ParamsOf<Id>>[];
	/** Shown in the outlet of this route when nothing matches below it. */
	notFound?: ComponentType;
	/** Shown in place of this route when it, or anything below it, throws. */
	error?: ComponentType<ErrorProps>;
};

/** A config tied to the id it was defined with, so a manifest can hold it to its key. */
export type Route<Id extends string, Query extends Search> = RouteConfig<Id, Query> & { readonly "~id"?: Id };
export type RouteModule<Id extends string = string> = { default: ComponentType; route?: Route<Id, Search> };
export type Routes = Record<string, () => Promise<RouteModule>>;
export type Manifest<Loaders> = { [Id in keyof Loaders & string]: () => Promise<RouteModule<Id>> };
export type RegisteredRoutes = Registered<"routes", Routes>;
export type RouteId = keyof RegisteredRoutes & string;

type Trim<Id extends string> = Id extends "/" ? Id : Id extends `${infer Path}/` ? Path : Id;
type SearchIn<Module> = Module extends { route: Route<string, infer Query extends Search> } ? Query : {};
type Covers<Id extends string, Path extends string> = Id extends "__root"
	? Id
	: Id extends `${string}/`
		? Path extends Trim<Id>
			? Id
			: never
		: Path extends Id | `${Id}/${string}`
			? Id
			: never;

type Intersect<Union> = (Union extends Union ? (value: Union) => void : never) extends (value: infer Value) => void ? Value : never;

/** Where a link can lead: the ids without the root, an index under the path of its layout. */
export type RoutePath = Trim<Exclude<RouteId, "__root">>;

/** Search of one route, as its validator returns it. */
export type SearchOf<Id extends RouteId> = string extends RouteId
	? Search
	: Id extends Id
		? SearchIn<Awaited<ReturnType<RegisteredRoutes[Id]>>>
		: never;

/** Search accepted by a path: the one of its route merged with its layouts'. */
export type SearchFor<Path extends string> = Simplify<Intersect<SearchOf<Covers<RouteId, Path> & RouteId>>>;

export type Target<Path extends RoutePath = RoutePath> = {
	to: Path;
	search?: Partial<SearchFor<Path>>;
	hash?: string;
} & (string extends Path ? { params?: Params } : [ParamName<Path>] extends [never] ? { params?: never } : { params: ParamsOf<Path> });
