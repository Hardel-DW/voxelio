# @voxelio/router

File-based, fully inferred router for React 19 and Vite 8, built on the
[Navigation API](https://developer.mozilla.org/docs/Web/API/Navigation_API).
Client only, ESM only, about 3.5 kB gzipped.

## Setup

```ts
// vite.config.ts
import react from "@vitejs/plugin-react";
import { router } from "@voxelio/router/vite";

export default defineConfig({ plugins: [router(), react()] });
```

```ts
// src/env.d.ts
/// <reference path="../node_modules/.voxelio/routes.d.ts" />
```

```tsx
// src/main.tsx
import { Outlet, startRouter } from "@voxelio/router";
import { routes } from "@voxelio/router/routes";

startRouter(routes);
createRoot(root).render(<Outlet />);
```

The plugin serves `src/pages` as `@voxelio/router/routes` and writes one types
file in `node_modules/.voxelio`. Nothing is generated in the project. On a fresh
clone, `voxelio-router && tsc --noEmit` writes the types without starting Vite.

Without the plugin, write the manifest by hand and register it:

```ts
export const routes = {
	__root: () => import("./pages/__root"),
	"/": () => import("./pages/index"),
	"/posts/$id": () => import("./pages/posts/$id")
};

declare module "@voxelio/router" {
	interface Register {
		routes: typeof routes;
	}
}
```

## Files

| File | Id | Matches |
| --- | --- | --- |
| `__root.tsx` | `__root` | the layout of everything |
| `index.tsx` | `/` | `/` |
| `posts.tsx` | `/posts` | `/posts`, and the layout of `posts/*` |
| `posts/index.tsx` | `/posts/` | `/posts`, inside the layout |
| `posts/$id.tsx` | `/posts/$id` | `/posts/42` |
| `files/$.tsx` | `/files/$` | `/files/a/b.png`, the rest is the `*` param |

A static segment wins over a param, a param over the splat. Every `.tsx` of the
directory is a route.

## A route

The default export is the route. Its component lives in the file or anywhere
else.

```tsx
import { defineRoute, notFound, useParams, useSearch } from "@voxelio/router";

export default defineRoute("/posts/$id", {
	component: Post,
	search: (raw) => ({ tab: raw.tab === "comments" ? "comments" : "content" }),
	beforeLoad: async ({ params, search, pathname }) => {
		if (!(await exists(params.id))) throw notFound();
	},
	head: ({ params }) => ({ title: `Post ${params.id}`, meta: { description: "…", "og:type": "article" } }),
	entries: () => [{ id: "1" }, { id: "2" }],
	notFound: Missing,
	error: Crashed
});

function Post() {
	const { id } = useParams();
	const { tab } = useSearch("/posts/$id");
	return <h1>{id} {tab}</h1>;
}
```

- `component` is what the route renders, the only required key.
- `search` turns the raw query into the typed search of the route.
- `beforeLoad` runs before the route is shown, parents first. Throw
  `redirect({ to })` or `notFound()` to leave.
- `head` sets the title, metas and links, merged over the parents' one.
- `notFound` shows in the outlet of the route when nothing matches below it.
- `error` replaces the route when it, or anything below it, throws.
- A layout renders `<Outlet />`. A pending state is a `<Suspense>` around it.

The id given to `defineRoute` is checked against the file: a route moved
without its id is a type error.

## Navigation

```tsx
<Link to="/posts/$id" params={{ id: "42" }} search={{ tab: "comments" }} hash="top" />

navigate({ to: "/posts/$id", params: { id: "42" }, replace: true });
patchSearch<"/posts/$id">({ tab: "comments" });
href({ to: "/" });
```

`to`, `params` and `search` are checked against the routes. A plain
`<a href>` is routed too, so links in markdown work as they are. A URL without
a page is left to the browser, so files and server routes keep working.

`Link` sets `aria-current="page"` on its own page and `data-active` on the
pages below it: `aria-[current=page]:text-white data-active:font-medium`.

`patchSearch` merges into the current search, keeps the focus and the scroll,
and replaces the history entry unless `{ replace: false }` is given. Browsers
drop history updates past about 200 in 10 seconds: fine for typing, not for
every frame of a drag.

Scroll restoration, focus reset and anchors are the browser's. Chunks are
fetched when a link is hovered or focused.

## Hooks

| Hook | Returns |
| --- | --- |
| `useParams()` | the params of the URL, typed with every param of the application |
| `useSearch(id)` | the validated search of a route, the same object until the query changes |
| `useLocation(select)` | a slice of `{ pathname, search }`, the selector returns a primitive or a kept reference |

## Options

```ts
startRouter(routes, { base, parseSearch, stringifySearch, preload });
router({ pages: "src/pages", prerender: true });
```

`base` defaults to the one of Vite. With a custom `parseSearch`, type what the
validators receive with `interface Register { search: MySearch }`.

`prerender` writes, after a build, one HTML file per page with the head of its
route, for crawlers and link previews. Dynamic routes list their params with
`entries`, combined with the ones of their layouts. The pages are not rendered:
`head` and `entries` must run without a browser.

`refresh()` validates the search and runs the guards again for the current
URL, after a login for instance.

## Hot reload

A page is refreshed in place by React Fast Refresh: its state stays, and an
edited `search`, `beforeLoad` or `head` applies as soon as the file is saved.
Give it another `component` and that one is shown. Adding or removing a page
reloads once. A page file exports nothing but its route.

## Browsers

Chrome and Edge 102, Firefox 147, Safari 26.2. Older browsers have no
Navigation API and are not supported.
