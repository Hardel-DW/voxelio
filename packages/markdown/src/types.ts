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

export type BlockToken =
	| { type: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; children: InlineToken[] }
	| { type: "paragraph"; children: InlineToken[] }
	| { type: "small_text"; children: InlineToken[] }
	| { type: "blockquote"; children: BlockToken[] }
	| { type: "hr" }
	| { type: "code_block"; lang?: string; content: string }
	| { type: "list"; ordered: boolean; items: ListItem[] }
	| { type: "table"; headers: InlineToken[][]; rows: InlineToken[][][] }
	| { type: "directive_leaf"; name: string; props: DirectiveProps }
	| { type: "directive_container"; name: string; props: DirectiveProps; children: BlockToken[] };

export type ListItem = {
	checked?: boolean;
	children: InlineToken[];
	sublist?: { ordered: boolean; items: ListItem[] };
};

export type Document = BlockToken[];
