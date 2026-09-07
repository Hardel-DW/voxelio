import { describe, expect, it } from "vitest";
import { parseFrontmatter } from "../src/frontmatter";
import { parseInline, plainText } from "../src/inline";
import { tokenize } from "../src/lexer";
import type { BlockToken, InlineToken } from "../src/types";

const children = (t: BlockToken): InlineToken[] => ("children" in t ? (t.children as InlineToken[]) : []);

describe("tokenize", () => {
	it("headings h1-h6 with inline formatting", () => {
		const doc = tokenize("# H1\n## H2 **bold**\n### H3\n#### H4\n##### H5\n###### H6");
		expect(doc).toHaveLength(6);
		expect(doc[0]).toMatchObject({ type: "heading", level: 1 });
		expect(doc[1]).toMatchObject({ type: "heading", level: 2 });
		expect(children(doc[1])).toContainEqual(expect.objectContaining({ type: "bold" }));
		expect(doc[5]).toMatchObject({ type: "heading", level: 6 });
	});

	it("inline: bold, italic, strike, code combined", () => {
		const doc = tokenize("**bold** *italic* ~~strike~~ `code` **nested *italic***");
		expect(doc[0].type).toBe("paragraph");
		const tokens = children(doc[0]);
		expect(tokens).toContainEqual(expect.objectContaining({ type: "bold" }));
		expect(tokens).toContainEqual(expect.objectContaining({ type: "italic" }));
		expect(tokens).toContainEqual(expect.objectContaining({ type: "strike" }));
		expect(tokens).toContainEqual(expect.objectContaining({ type: "code", content: "code" }));
	});

	it("links, images, autolinks", () => {
		const doc = tokenize("[text](https://example.com)\n\n![alt](img.png)\n\n<https://auto.link>");
		expect(children(doc[0])).toContainEqual(expect.objectContaining({ type: "link", href: "https://example.com" }));
		expect(children(doc[1])).toContainEqual(expect.objectContaining({ type: "image", src: "img.png", alt: "alt" }));
		expect(children(doc[2])).toContainEqual(expect.objectContaining({ type: "link", href: "https://auto.link" }));
	});

	it("lists: ordered, unordered, nested, tasks", () => {
		const md = `- item1
- item2
  - nested
1. ordered1
2. ordered2
- [x] done
- [ ] todo`;
		const doc = tokenize(md);
		const ul = doc.find((t): t is Extract<BlockToken, { type: "list" }> => t.type === "list" && !t.ordered);
		const ol = doc.find((t): t is Extract<BlockToken, { type: "list" }> => t.type === "list" && t.ordered);
		expect(ul).toBeDefined();
		expect(ol).toBeDefined();
		expect(ul?.items[1].sublist).toBeDefined();
		const tasks = doc.filter((t): t is Extract<BlockToken, { type: "list" }> => t.type === "list");
		expect(tasks.some((t) => t.items.some((i) => i.checked !== undefined))).toBe(true);
	});

	it("code blocks with and without lang", () => {
		const doc = tokenize("```js\nconst x = 1;\n```\n\n```\nplain\n```");
		expect(doc[0]).toMatchObject({ type: "code_block", lang: "js", content: "const x = 1;" });
		expect(doc[1]).toMatchObject({ type: "code_block", lang: undefined, content: "plain" });
	});

	it("blockquote with nested content", () => {
		const doc = tokenize("> quote\n> **bold** in quote\n> > nested");
		const bq = doc[0];
		expect(bq.type).toBe("blockquote");
		if (bq.type === "blockquote") expect(bq.children.length).toBeGreaterThan(0);
	});

	it("table with headers and rows", () => {
		const doc = tokenize("| A | B |\n|---|---|\n| 1 | 2 |\n| 3 | 4 |");
		const table = doc[0];
		expect(table.type).toBe("table");
		if (table.type === "table") {
			expect(table.headers).toHaveLength(2);
			expect(table.rows).toHaveLength(2);
		}
	});

	it("directives: leaf and container", () => {
		const doc = tokenize('::leaf{key="value"}\n\n:::container{a="1"}\ninner content\n:::');
		expect(doc[0]).toMatchObject({ type: "directive_leaf", name: "leaf", props: { key: "value" } });
		expect(doc[1]).toMatchObject({ type: "directive_container", name: "container", props: { a: "1" } });
		const container = doc[1];
		if (container.type === "directive_container") expect(container.children.length).toBeGreaterThan(0);
	});

	it("small text", () => {
		const doc = tokenize("-# small text here");
		expect(doc[0]).toMatchObject({ type: "small_text" });
	});

	it("horizontal rule", () => {
		const doc = tokenize("---\n\n----\n\n-----");
		expect(doc.every((t) => t.type === "hr")).toBe(true);
		expect(doc).toHaveLength(3);
	});

	it("edge cases: unclosed tags, empty, escapes", () => {
		expect(tokenize("")).toEqual([]);
		expect(tokenize("   \n\n   ")).toEqual([]);
		const unclosed = tokenize("**unclosed bold");
		expect(unclosed[0].type).toBe("paragraph");
		const escaped = tokenize("\\*not italic\\*");
		expect(children(escaped[0])).not.toContainEqual(expect.objectContaining({ type: "italic" }));
	});

	it("security: blocks javascript urls", () => {
		const doc = tokenize("[click](javascript:alert(1))\n\n![img](javascript:void)");
		expect(children(doc[0]).find((t) => t.type === "link")).toBeUndefined();
		expect(children(doc[1]).find((t) => t.type === "image")).toBeUndefined();
	});

	it("hard breaks with 2+ spaces", () => {
		const doc = tokenize("line1  \nline2");
		expect(children(doc[0])).toContainEqual(expect.objectContaining({ type: "br" }));
	});

	it("a huge paragraph is just a paragraph", () => {
		const doc = tokenize("x".repeat(200_000));
		expect(doc).toHaveLength(1);
		expect(children(doc[0])).toEqual([{ type: "text", content: "x".repeat(200_000) }]);
	});

	it("a line that looks like a block but is not becomes a paragraph", () => {
		expect(tokenize("#hashtag\n|not a table")).toEqual([
			{ type: "paragraph", children: [{ type: "text", content: "#hashtag" }] },
			{ type: "paragraph", children: [{ type: "text", content: "|not a table" }] }
		]);
	});

	it("nested containers close in order", () => {
		const doc = tokenize(":::outer\n:::inner\ntext\n:::\nafter\n:::\ntail");
		expect(doc).toHaveLength(2);
		expect(doc[0]).toMatchObject({ type: "directive_container", name: "outer" });
		if (doc[0].type !== "directive_container") return;
		expect(doc[0].children).toHaveLength(2);
		expect(doc[0].children[0]).toMatchObject({ type: "directive_container", name: "inner" });
		expect(doc[1]).toMatchObject({ type: "paragraph" });
	});

	it("a container keeps a fenced code block containing its closer", () => {
		const doc = tokenize(":::box\n```\n:::\n```\n:::");
		expect(doc).toHaveLength(1);
		if (doc[0].type !== "directive_container") return;
		expect(doc[0].children).toEqual([{ type: "code_block", lang: undefined, meta: {}, content: ":::" }]);
	});

	it("inline directives start at a word boundary", () => {
		expect(children(tokenize("at 10:30 sharp")[0])).toEqual([{ type: "text", content: "at 10:30 sharp" }]);
		expect(children(tokenize("see :icon{name=leaf} here")[0])).toContainEqual({
			type: "directive",
			name: "icon",
			props: { name: "leaf" }
		});
	});

	it("links keep balanced parentheses in the url", () => {
		const doc = tokenize("[wiki](https://en.wikipedia.org/wiki/Fork_(software)) end");
		expect(children(doc[0])).toEqual([
			{ type: "link", href: "https://en.wikipedia.org/wiki/Fork_(software)", children: [{ type: "text", content: "wiki" }] },
			{ type: "text", content: " end" }
		]);
	});

	it("a list may start indented", () => {
		const doc = tokenize("  - a\n  - b");
		expect(doc[0]).toMatchObject({ type: "list", ordered: false });
		if (doc[0].type === "list") expect(doc[0].items).toHaveLength(2);
	});

	it("a nested list of another kind belongs to the item above", () => {
		const doc = tokenize("- a\n  1. one\n  2. two\n- b");
		expect(doc).toHaveLength(1);
		if (doc[0].type !== "list") return;
		expect(doc[0].items).toHaveLength(2);
		expect(doc[0].items[0].sublist).toMatchObject({ ordered: true });
		expect(doc[0].items[0].sublist?.items).toHaveLength(2);
	});

	it("code fences carry a language and meta props", () => {
		const doc = tokenize('```json title="config/leafs.json"\n{}\n```');
		expect(doc[0]).toEqual({ type: "code_block", lang: "json", meta: { title: "config/leafs.json" }, content: "{}" });
	});

	it("soft line breaks stay in the text", () => {
		expect(children(tokenize("one\ntwo")[0])).toEqual([{ type: "text", content: "one\ntwo" }]);
	});
});

describe("plainText", () => {
	it("flattens formatting, links and images", () => {
		expect(plainText(parseInline("a **b** [c](x) ![d](y) `e` :dir"))).toBe("a b c d e ");
	});
});

describe("parseFrontmatter", () => {
	it("splits fields from the body and strips quotes", () => {
		const { data, body } = parseFrontmatter('---\ntitle: "Les régions"\nlead: Le monde : découpé\n---\n\n# Titre');
		expect(data).toEqual({ title: "Les régions", lead: "Le monde : découpé" });
		expect(body).toBe("\n# Titre");
	});

	it("leaves a document without frontmatter untouched", () => {
		const markdown = "# Titre\n\ntexte";
		expect(parseFrontmatter(markdown)).toEqual({ data: {}, body: markdown });
		expect(parseFrontmatter("---\nunclosed")).toEqual({ data: {}, body: "---\nunclosed" });
	});
});
