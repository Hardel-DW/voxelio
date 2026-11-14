import { describe, expect, it } from "vitest";
import { compile, fill, match } from "../src/path";

const table = compile([
	"__root",
	"/",
	"/about",
	"/$lang",
	"/$lang/",
	"/$lang/posts/$id",
	"/$lang/posts/new",
	"/docs/",
	"/docs/$slug",
	"/files/$",
	"/files/readme"
]);

describe("match", () => {
	it("matches the index of the root", () => {
		expect(match(table, "/")).toEqual({ ids: ["__root", "/"], params: {}, found: true });
	});

	it("walks the layouts down to the index", () => {
		expect(match(table, "/fr")).toEqual({ ids: ["__root", "/$lang", "/$lang/"], params: { lang: "fr" }, found: true });
	});

	it("collects the params of every level", () => {
		expect(match(table, "/fr/posts/42")).toEqual({
			ids: ["__root", "/$lang", "/$lang/posts/$id"],
			params: { lang: "fr", id: "42" },
			found: true
		});
	});

	it("prefers static segments over params, and params over the splat", () => {
		expect(match(table, "/about").ids).toEqual(["__root", "/about"]);
		expect(match(table, "/fr/posts/new").ids).toEqual(["__root", "/$lang", "/$lang/posts/new"]);
		expect(match(table, "/files/readme").ids).toEqual(["__root", "/files/readme"]);
	});

	it("gives the rest of the path to a splat", () => {
		expect(match(table, "/files/a/b.png")).toEqual({ ids: ["__root", "/files/$"], params: { "*": "a/b.png" }, found: true });
	});

	it("matches an index without its layout", () => {
		expect(match(table, "/docs").ids).toEqual(["__root", "/docs/"]);
		expect(match(table, "/docs/intro")).toEqual({ ids: ["__root", "/docs/$slug"], params: { slug: "intro" }, found: true });
	});

	it("decodes the params and survives a malformed one", () => {
		expect(match(table, "/docs/caf%C3%A9").params).toEqual({ slug: "café" });
		expect(match(table, "/docs/%E0%A4%A").params).toEqual({ slug: "%E0%A4%A" });
	});

	it("falls back on the deepest layout when no page matches", () => {
		expect(match(table, "/fr/nope/deeper")).toEqual({ ids: ["__root", "/$lang"], params: { lang: "fr" }, found: false });
	});

	it("never hosts a missing page in a route without children", () => {
		expect(match(compile(["__root", "/about", "/docs/"]), "/about/team")).toEqual({ ids: ["__root"], params: {}, found: false });
		expect(match(compile(["__root", "/about", "/docs/"]), "/docs/intro")).toEqual({ ids: ["__root"], params: {}, found: false });
	});

	it("works without a root", () => {
		expect(match(compile(["/"]), "/nope")).toEqual({ ids: [], params: {}, found: false });
	});
});

describe("fill", () => {
	it("writes the params into the path", () => {
		expect(fill("/$lang/posts/$id", { lang: "fr", id: "a b" })).toBe("/fr/posts/a%20b");
	});

	it("keeps the slashes of a splat", () => {
		expect(fill("/files/$", { "*": "a/b c.png" })).toBe("/files/a/b%20c.png");
	});

	it("leaves a path without params alone", () => {
		expect(fill("/about")).toBe("/about");
	});
});
