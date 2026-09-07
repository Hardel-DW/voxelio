import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RawMarkdown, render } from "../src/render";
import { tokenize } from "../src/lexer";

const html = (markdown: string, options = {}) => renderToStaticMarkup(render(tokenize(markdown), options));

describe("render", () => {
	it("renders the default elements", () => {
		expect(html("# Title\n\ntext **bold** `code`")).toBe("<h1>Title</h1><p>text <strong>bold</strong> <code>code</code></p>");
	});

	it("gives headings their plain text and code blocks their meta", () => {
		const components = {
			h2: ({ text, children }: { text: string; children: React.ReactNode }) => <h2 id={text}>{children}</h2>,
			pre: ({ lang, meta, code }: { lang?: string; meta: Record<string, string>; code: string }) => (
				<pre title={meta.title} data-lang={lang}>
					{code}
				</pre>
			)
		};
		expect(html('## Les **régions**\n\n```json title="a.json"\n{}\n```', { components })).toBe(
			'<h2 id="Les régions">Les <strong>régions</strong></h2><pre title="a.json" data-lang="json">{}</pre>'
		);
	});

	it("passes directive props and children", () => {
		const directives = {
			note: ({ props, children }: { props: Record<string, string>; children?: React.ReactNode }) => (
				<aside className={props.tone}>{children}</aside>
			),
			icon: ({ props }: { props: Record<string, string> }) => <i>{props.name}</i>
		};
		expect(html(':::note{tone="warn"}\nsee :icon{name=leaf}\n:::', { directives })).toBe(
			'<aside class="warn"><p>see <i>leaf</i></p></aside>'
		);
	});

	it("ignores unknown directives, including prototype names", () => {
		expect(html("::constructor\n\n:::toString\nx\n:::\n\ntext :hasOwnProperty")).toBe("<p>text </p>");
	});

	it("renders task lists read only", () => {
		expect(html("- [x] done")).toBe('<ul><li><input type="checkbox" readOnly="" checked=""/>done</li></ul>');
	});

	it("RawMarkdown renders a string", () => {
		expect(renderToStaticMarkup(<RawMarkdown content="*hi*" />)).toBe("<p><em>hi</em></p>");
		expect(renderToStaticMarkup(<RawMarkdown />)).toBe("");
	});
});
