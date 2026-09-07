import type { ReactNode } from "react";
import { plainText } from "./inline";
import { tokenize } from "./lexer";
import type { BlockToken, DirectiveProps, InlineToken, ListItem, ListToken } from "./types";

type Parent = { children: ReactNode };
type Component<Props> = (props: Props) => ReactNode;

export type HeadingProps = Parent & { text: string };
export type CodeBlockProps = { lang?: string; meta: DirectiveProps; code: string };
export type DirectiveComponent = Component<{ props: DirectiveProps; children?: ReactNode }>;
export type Directives = Record<string, DirectiveComponent>;

export type Components = {
	h1?: Component<HeadingProps>;
	h2?: Component<HeadingProps>;
	h3?: Component<HeadingProps>;
	h4?: Component<HeadingProps>;
	h5?: Component<HeadingProps>;
	h6?: Component<HeadingProps>;
	p?: Component<Parent>;
	small?: Component<Parent>;
	strong?: Component<Parent>;
	em?: Component<Parent>;
	del?: Component<Parent>;
	a?: Component<Parent & { href: string }>;
	img?: Component<{ src: string; alt: string }>;
	code?: Component<Parent>;
	pre?: Component<CodeBlockProps>;
	blockquote?: Component<Parent>;
	ul?: Component<Parent>;
	ol?: Component<Parent>;
	li?: Component<Parent & { checked?: boolean }>;
	input?: Component<{ type: "checkbox"; checked: boolean; readOnly: boolean }>;
	hr?: Component<Record<never, never>>;
	table?: Component<Parent>;
	thead?: Component<Parent>;
	tbody?: Component<Parent>;
	tr?: Component<Parent>;
	th?: Component<Parent>;
	td?: Component<Parent>;
	br?: Component<Record<never, never>>;
};

export type RenderOptions = { components?: Components; directives?: Directives };

const defaults: Required<Components> = {
	h1: ({ children }) => <h1>{children}</h1>,
	h2: ({ children }) => <h2>{children}</h2>,
	h3: ({ children }) => <h3>{children}</h3>,
	h4: ({ children }) => <h4>{children}</h4>,
	h5: ({ children }) => <h5>{children}</h5>,
	h6: ({ children }) => <h6>{children}</h6>,
	p: ({ children }) => <p>{children}</p>,
	small: ({ children }) => <small>{children}</small>,
	strong: ({ children }) => <strong>{children}</strong>,
	em: ({ children }) => <em>{children}</em>,
	del: ({ children }) => <del>{children}</del>,
	a: ({ href, children }) => <a href={href}>{children}</a>,
	img: ({ src, alt }) => <img src={src} alt={alt} />,
	code: ({ children }) => <code>{children}</code>,
	pre: ({ code }) => (
		<pre>
			<code>{code}</code>
		</pre>
	),
	blockquote: ({ children }) => <blockquote>{children}</blockquote>,
	ul: ({ children }) => <ul>{children}</ul>,
	ol: ({ children }) => <ol>{children}</ol>,
	li: ({ children }) => <li>{children}</li>,
	input: (props) => <input {...props} />,
	hr: () => <hr />,
	table: ({ children }) => <table>{children}</table>,
	thead: ({ children }) => <thead>{children}</thead>,
	tbody: ({ children }) => <tbody>{children}</tbody>,
	tr: ({ children }) => <tr>{children}</tr>,
	th: ({ children }) => <th>{children}</th>,
	td: ({ children }) => <td>{children}</td>,
	br: () => <br />
};

type Context = { components: Required<Components>; directives: Directives };

const directiveOf = (ctx: Context, name: string): DirectiveComponent | null =>
	Object.hasOwn(ctx.directives, name) ? ctx.directives[name] : null;

function renderInlineToken(token: InlineToken, ctx: Context, key: string): ReactNode {
	const { components } = ctx;
	switch (token.type) {
		case "text":
			return token.content;
		case "bold":
			return <components.strong key={key}>{renderInline(token.children, ctx, key)}</components.strong>;
		case "italic":
			return <components.em key={key}>{renderInline(token.children, ctx, key)}</components.em>;
		case "strike":
			return <components.del key={key}>{renderInline(token.children, ctx, key)}</components.del>;
		case "code":
			return <components.code key={key}>{token.content}</components.code>;
		case "link":
			return (
				<components.a key={key} href={token.href}>
					{renderInline(token.children, ctx, key)}
				</components.a>
			);
		case "image":
			return <components.img key={key} src={token.src} alt={token.alt} />;
		case "directive": {
			const Directive = directiveOf(ctx, token.name);
			return Directive && <Directive key={key} props={token.props} />;
		}
		case "br":
			return <components.br key={key} />;
	}
}

function renderInline(tokens: InlineToken[], ctx: Context, prefix: string): ReactNode {
	return tokens.map((token, index) => renderInlineToken(token, ctx, `${prefix}-i${index}`));
}

function renderListItem(item: ListItem, ctx: Context, key: string): ReactNode {
	const { components } = ctx;
	return (
		<components.li key={key} checked={item.checked}>
			{item.checked !== undefined && <components.input type="checkbox" checked={item.checked} readOnly />}
			{renderInline(item.children, ctx, key)}
			{item.sublist && renderList(item.sublist, ctx, `${key}-sub`)}
		</components.li>
	);
}

function renderList(list: ListToken, ctx: Context, key: string): ReactNode {
	const List = list.ordered ? ctx.components.ol : ctx.components.ul;
	return <List key={key}>{list.items.map((item, index) => renderListItem(item, ctx, `${key}-li${index}`))}</List>;
}

function renderCell(cell: InlineToken[], ctx: Context, key: string, Cell: Component<Parent>): ReactNode {
	return <Cell key={key}>{renderInline(cell, ctx, key)}</Cell>;
}

function renderRow(cells: InlineToken[][], ctx: Context, key: string, Cell: Component<Parent>): ReactNode {
	return <ctx.components.tr key={key}>{cells.map((cell, index) => renderCell(cell, ctx, `${key}-c${index}`, Cell))}</ctx.components.tr>;
}

function renderTable(headers: InlineToken[][], rows: InlineToken[][][], ctx: Context, key: string): ReactNode {
	const { components } = ctx;
	return (
		<components.table key={key}>
			<components.thead>{renderRow(headers, ctx, `${key}-head`, components.th)}</components.thead>
			<components.tbody>{rows.map((row, index) => renderRow(row, ctx, `${key}-r${index}`, components.td))}</components.tbody>
		</components.table>
	);
}

function renderBlock(token: BlockToken, ctx: Context, key: string): ReactNode {
	const { components } = ctx;
	switch (token.type) {
		case "directive_container": {
			const Directive = directiveOf(ctx, token.name);
			return (
				Directive && (
					<Directive key={key} props={token.props}>
						{renderBlocks(token.children, ctx, key)}
					</Directive>
				)
			);
		}
		case "directive_leaf": {
			const Directive = directiveOf(ctx, token.name);
			return Directive && <Directive key={key} props={token.props} />;
		}
		case "heading": {
			const Heading = components[`h${token.level}`];
			return (
				<Heading key={key} text={plainText(token.children)}>
					{renderInline(token.children, ctx, key)}
				</Heading>
			);
		}
		case "paragraph":
			return <components.p key={key}>{renderInline(token.children, ctx, key)}</components.p>;
		case "small_text":
			return <components.small key={key}>{renderInline(token.children, ctx, key)}</components.small>;
		case "blockquote":
			return <components.blockquote key={key}>{renderBlocks(token.children, ctx, key)}</components.blockquote>;
		case "hr":
			return <components.hr key={key} />;
		case "code_block":
			return <components.pre key={key} lang={token.lang} meta={token.meta} code={token.content} />;
		case "list":
			return renderList(token, ctx, key);
		case "table":
			return renderTable(token.headers, token.rows, ctx, key);
	}
}

function renderBlocks(tokens: BlockToken[], ctx: Context, prefix: string): ReactNode {
	return tokens.map((token, index) => renderBlock(token, ctx, `${prefix}b${index}`));
}

export function render(blocks: BlockToken[], options: RenderOptions = {}): ReactNode {
	return renderBlocks(blocks, { components: { ...defaults, ...options.components }, directives: options.directives ?? {} }, "");
}

export function RawMarkdown({ content, ...options }: RenderOptions & { content?: string }): ReactNode {
	if (!content) return null;
	return render(tokenize(content), options);
}
