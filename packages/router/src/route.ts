import { createElement, type ReactNode } from "react";
import type { Route, RouteConfig, RouteId, Search } from "./types";

/**
 * `export default defineRoute("/posts/$id", { component: Post, ... })`, the default export of a route file.
 * The route is itself a component, named so that React Fast Refresh takes the file as a boundary.
 */
export function defineRoute<const Id extends RouteId, Query extends Search = {}>(_id: Id, route: RouteConfig<Id, Query>): Route<Id, Query> {
	const { Route } = { Route: (): ReactNode => createElement(route.component) };
	return Object.assign(Route, { route });
}
