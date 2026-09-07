export type DirectiveProps = Record<string, string>;

export type InlineToken =
	| { type: "text"; content: string }
	| { type: "bold"; children: InlineToken[] }
	| { type: "italic"; children: InlineToken[] }
	| { type: "strike"; children: InlineToken[] }
	| { type: "code"; content: string }
	| { type: "link"; href: string; children: InlineToken[] }
	| { type: "image"; src: string; alt: string }
	| { type: "directive"; name: string; props: DirectiveProps }
	| { type: "br" };

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type ListItem = {
	checked?: boolean;
	children: InlineToken[];
	sublist?: ListToken;
};

export type ListToken = { type: "list"; ordered: boolean; items: ListItem[] };

export type BlockToken =
	| { type: "heading"; level: HeadingLevel; children: InlineToken[] }
	| { type: "paragraph"; children: InlineToken[] }
	| { type: "small_text"; children: InlineToken[] }
	| { type: "blockquote"; children: BlockToken[] }
	| { type: "hr" }
	| { type: "code_block"; lang?: string; meta: DirectiveProps; content: string }
	| ListToken
	| { type: "table"; headers: InlineToken[][]; rows: InlineToken[][][] }
	| { type: "directive_leaf"; name: string; props: DirectiveProps }
	| { type: "directive_container"; name: string; props: DirectiveProps; children: BlockToken[] };

export type Frontmatter = { data: Record<string, string>; body: string };
