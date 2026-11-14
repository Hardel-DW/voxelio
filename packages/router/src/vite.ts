import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createServer, isRunnableDevEnvironment, normalizePath, type Plugin, type ResolvedConfig } from "vite";
import { HEAD_MARK, headTags, mergeHead } from "./head";
import { type Entry, hotManifestCode, hotPageCode, manifestCode, PAGES_DIR, routeId, scan, writeTypes } from "./manifest";
import { compile, fill, match } from "./path";
import type { Head, Params, RouteModule } from "./types";

export type RouterPluginOptions = {
	/** Directory of the route files, from the root of the project. `src/pages` unless given. */
	pages?: string;
	/** After a build, writes one HTML file per page with the head of its route. */
	prerender?: boolean;
};

export type Page = { pathname: string; head: Head };

const MODULE = "@voxelio/router/routes";
const RESOLVED = `\0${MODULE}`;
const MODULE_ID = /^@voxelio\/router\/routes$/;
const RESOLVED_ID = /^\0@voxelio\/router\/routes$/;
const PAGE_ID = /\.tsx(?:\?|$)/;

const encode = (value: string): string => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
const trim = (id: string): string => id.replace(/(?<=.)\/$/, "");
const paramNames = (path: string): string[] => [...path.matchAll(/\$([^/]*)/g)].map(([, name]) => name || "*");
const isRoute = (module: object): module is RouteModule =>
	"default" in module && typeof module.default === "function" && "route" in module.default;

/** The title keeps the one of the template aside, for the routes that set none. */
export function renderHead(template: string, head: Head): string {
	const tags = headTags(head).map(({ name, attributes }) => {
		const pairs = Object.entries(attributes).map(([attribute, value]) => `${attribute}="${encode(value)}"`);
		return `<${name} ${pairs.join(" ")} ${HEAD_MARK}>`;
	});

	if (head.title === undefined) return template.replace("</head>", `${tags.join("")}</head>`);
	const original = template.match(/<title>([^<]*)<\/title>/);
	const title = `<title ${HEAD_MARK}="${original?.[1] ?? ""}">${encode(head.title)}</title>`;
	return template.replace(original?.[0] ?? "", "").replace("</head>", `${title}${tags.join("")}</head>`);
}

/** One page per path whose params are all given by the `entries` of its routes. */
export function pagesOf(modules: Map<string, RouteModule>): Page[] {
	const table = compile([...modules.keys()]);
	const paths = new Set([...modules.keys()].filter((id) => id.startsWith("/")).map(trim));

	return [...paths].flatMap((path) => {
		const routes = match(table, path).ids.flatMap((id) => modules.get(id)?.default.route ?? []);
		const combined = routes.reduce<Partial<Params>[]>(
			(sets, route) => {
				const entries = route.entries?.();
				return entries ? sets.flatMap((set) => entries.map((entry) => ({ ...set, ...entry }))) : sets;
			},
			[{}]
		);

		return combined
			.filter((params): params is Params => paramNames(path).every((name) => params[name] !== undefined))
			.map((params) => ({ params, pathname: fill(path, params) }))
			.map(({ params, pathname }) => ({
				pathname,
				head: mergeHead(routes.map((route) => route.head?.({ params, pathname }) ?? {}))
			}));
	});
}

/** The pages are evaluated by Vite itself, so they resolve exactly as in the application. */
async function prerender(config: ResolvedConfig, entries: Entry[]): Promise<void> {
	const outDir = join(config.root, config.build.outDir);
	const template = readFileSync(join(outDir, "index.html"), "utf8");
	const server = await createServer({
		root: config.root,
		configFile: config.configFile,
		mode: config.mode,
		appType: "custom",
		logLevel: "error",
		optimizeDeps: { noDiscovery: true },
		server: { middlewareMode: true, hmr: false, ws: false, watch: null }
	});

	try {
		const { ssr } = server.environments;
		if (!isRunnableDevEnvironment(ssr)) throw new Error("@voxelio/router prerenders through a runnable `ssr` environment");

		const modules = new Map<string, RouteModule>();
		for (const { id, file } of entries) {
			const module = await ssr.runner.import(`/${file}`);
			if (!isRoute(module)) throw new Error(`${file} must have \`export default defineRoute(...)\``);

			modules.set(id, module);
		}

		const pages = pagesOf(modules);
		for (const { pathname, head } of pages) {
			const file = join(outDir, decodeURI(pathname), "index.html");
			mkdirSync(dirname(file), { recursive: true });
			writeFileSync(file, renderHead(template, head));
		}
		config.logger.info(`@voxelio/router prerendered the head of ${pages.length} pages`);
	} finally {
		await server.close();
	}
}

/**
 * Serves the pages directory as `@voxelio/router/routes` and keeps its types up to date.
 * While serving, a second plugin wires the pages to React Refresh and reloads when one is added or removed.
 */
export function router(options: RouterPluginOptions = {}): Plugin[] {
	const directory = options.pages ?? PAGES_DIR;
	let config: ResolvedConfig;
	let pages = "";

	const isPage = (file: string): boolean => file.startsWith(`${pages}/`) && file.endsWith(".tsx");
	const sync = (): Entry[] => {
		const entries = scan(config.root, directory);
		writeTypes(config.root, entries);
		return entries;
	};

	return [
		{
			name: "voxelio:router",
			enforce: "pre",
			configResolved(resolved) {
				config = resolved;
				pages = normalizePath(join(resolved.root, directory));
				sync();
			},
			resolveId: {
				filter: { id: MODULE_ID },
				handler: (id) => (id === MODULE ? RESOLVED : undefined)
			},
			load: {
				filter: { id: RESOLVED_ID },
				handler(id) {
					if (id !== RESOLVED) return;
					return config.command === "serve" ? hotManifestCode(sync()) : manifestCode(sync());
				}
			},
			async closeBundle() {
				if (!options.prerender || config.command !== "build" || this.environment.name !== "client") return;
				await prerender(config, scan(config.root, directory));
			}
		},
		{
			name: "voxelio:router:refresh",
			enforce: "pre",
			apply: "serve",
			applyToEnvironment: (environment) => environment.config.consumer === "client",
			transform: {
				filter: { id: PAGE_ID },
				handler(code, id) {
					const [file] = id.split("?");
					if (!isPage(file)) return;

					return { code: code + hotPageCode(routeId(file.slice(pages.length + 1))), map: null };
				}
			},
			hotUpdate({ type, file }) {
				if (type === "update" || !isPage(file)) return;

				const manifest = this.environment.moduleGraph.getModuleById(RESOLVED);
				if (manifest) this.environment.moduleGraph.invalidateModule(manifest);
				sync();
				this.environment.hot.send({ type: "full-reload" });
				return [];
			}
		}
	];
}
