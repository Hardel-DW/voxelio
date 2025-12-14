import { describe, expect, it } from "vitest";
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

	it("throws on infinite loop attempt", () => {
		const malicious = "x".repeat(200_000);
		expect(() => tokenize(malicious)).toThrow("limit exceeded");
	});
});
