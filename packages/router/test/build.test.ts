import { describe, expect, it } from "vitest";
import { headTags, mergeHead } from "../src/head";
import { hotManifestCode, hotPageCode, manifestCode, routeId, typesCode } from "../src/manifest";
import { defineRoute } from "../src/route";
import type { RouteModule } from "../src/types";
import { pagesOf, renderHead } from "../src/vite";

const Page = (): null => null;
const entries = [
	{ id: "__root", file: "src/pages/__root.tsx" },
	{ id: "/", file: "src/pages/index.tsx" },
	{ id: "/docs/$slug", file: "src/pages/docs/$slug.tsx" }
];

describe("routeId", () => {
	it("maps the files to their ids", () => {
		expect(routeId("__root.tsx")).toBe("__root");
		expect(routeId("index.tsx")).toBe("/");
		expect(routeId("posts.tsx")).toBe("/posts");
		expect(routeId("posts\\index.tsx")).toBe("/posts/");
		expect(routeId("$lang/posts/$id.tsx")).toBe("/$lang/posts/$id");
		expect(routeId("files/$.tsx")).toBe("/files/$");
	});
});

describe("manifestCode", () => {
	it("is one lazy import per route in a build", () => {
		expect(manifestCode(entries)).toBe(
			[
				"export const routes = {",
				'\t"__root": () => import("/src/pages/__root.tsx"),',
				'\t"/": () => import("/src/pages/index.tsx"),',
				'\t"/docs/$slug": () => import("/src/pages/docs/$slug.tsx")',
				"};",
				""
			].join("\n")
		);
	});

	it("accepts its own updates while serving", () => {
		const code = hotManifestCode(entries);
		expect(code).toContain(manifestCode(entries));
		expect(code).toContain("if (import.meta.hot) import.meta.hot.accept((next) => next && reloadRoutes(next.routes));");
	});

	it("hands the new config of an edited page to the router", () => {
		expect(hotPageCode("/docs/$slug")).toContain(
			'import.meta.hot.accept((next) => next && __reloadRoute("/docs/$slug", next.default.route));'
		);
	});
});

describe("typesCode", () => {
	it("registers each route by the type of its own file", () => {
		const code = typesCode("/project", entries);
		expect(code).toContain('declare module "@voxelio/router"');
		expect(code).toContain('"/docs/$slug": () => Promise<typeof import("../../src/pages/docs/$slug")>;');
	});
});

describe("head", () => {
	it("lets the deepest route win key by key", () => {
		const head = mergeHead([
			{ title: "Site", meta: { description: "site", "og:type": "website" } },
			{},
			{ title: "Page", meta: { description: "page" } }
		]);
		expect(head).toEqual({ title: "Page", meta: { description: "page", "og:type": "website" }, link: {} });
	});

	it("writes open graph keys as properties and the rest as names", () => {
		expect(headTags({ meta: { description: "d", "og:title": "t", "twitter:card": "c" }, link: { canonical: "https://a.b/" } })).toEqual(
			[
				{ name: "meta", attributes: { name: "description", content: "d" } },
				{ name: "meta", attributes: { property: "og:title", content: "t" } },
				{ name: "meta", attributes: { name: "twitter:card", content: "c" } },
				{ name: "link", attributes: { rel: "canonical", href: "https://a.b/" } }
			]
		);
	});
});

describe("renderHead", () => {
	const template = "<html><head><title>Site</title></head><body></body></html>";

	it("replaces the title and keeps the one of the template aside", () => {
		expect(renderHead(template, { title: 'A "page" <b>', meta: { description: "d" } })).toBe(
			'<html><head><title data-head="Site">A &quot;page&quot; &lt;b></title><meta name="description" content="d" data-head></head><body></body></html>'
		);
	});

	it("leaves the title of the template when the route has none", () => {
		expect(renderHead(template, {})).toBe(template);
	});
});

describe("pagesOf", () => {
	const modules = new Map<string, RouteModule>([
		[
			"__root",
			{ default: defineRoute("__root", { component: Page, head: () => ({ title: "Site", meta: { "og:type": "website" } }) }) }
		],
		["/", { default: defineRoute("/", { component: Page }) }],
		[
			"/$lang",
			{
				default: defineRoute("/$lang", {
					component: Page,
					entries: () => [{ lang: "en" }, { lang: "fr" }],
					head: ({ params }) => ({ title: params.lang })
				})
			}
		],
		["/$lang/", { default: defineRoute("/$lang/", { component: Page }) }],
		[
			"/$lang/docs/$slug",
			{
				default: defineRoute("/$lang/docs/$slug", {
					component: Page,
					entries: () => [{ slug: "intro" }],
					head: ({ params, pathname }) => ({ title: `${params.slug} ${params.lang}`, link: { canonical: pathname } })
				})
			}
		],
		["/$lang/user/$id", { default: defineRoute("/$lang/user/$id", { component: Page }) }]
	]);

	it("combines the entries of the routes and skips the paths left with a hole", () => {
		const pages = pagesOf(modules);
		expect(pages.map((page) => page.pathname)).toEqual(["/", "/en", "/fr", "/en/docs/intro", "/fr/docs/intro"]);
		expect(pages[0].head.title).toBe("Site");
		expect(pages[2].head).toEqual({ title: "fr", meta: { "og:type": "website" }, link: {} });
		expect(pages[4].head).toEqual({ title: "intro fr", meta: { "og:type": "website" }, link: { canonical: "/fr/docs/intro" } });
	});
});

describe("defineRoute", () => {
	it("returns a component that carries its config and keeps a component name once minified", () => {
		const config = { component: Page, head: () => ({ title: "Site" }) };
		const route = defineRoute("/", config);

		expect(route.route).toBe(config);
		expect(route.name).toBe("Route");
		expect(route()).toMatchObject({ type: Page });
	});
});
