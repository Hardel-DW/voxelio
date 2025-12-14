import type { ReactNode } from "react";
import { tokenize } from "./lexer";
import type { BlockToken, Document, InlineToken, ListItem } from "./types.ts";

export type DirectiveComponent = (props: Record<string, unknown>) => ReactNode;
export type Directives = Record<string, DirectiveComponent>;

export type Components = {
	h1?: (props: { children: ReactNode }) => ReactNode;
	h2?: (props: { children: ReactNode }) => ReactNode;
	h3?: (props: { children: ReactNode }) => ReactNode;
	h4?: (props: { children: ReactNode }) => ReactNode;
	h5?: (props: { children: ReactNode }) => ReactNode;
	h6?: (props: { children: ReactNode }) => ReactNode;
	p?: (props: { children: ReactNode }) => ReactNode;
	small?: (props: { children: ReactNode }) => ReactNode;
	strong?: (props: { children: ReactNode }) => ReactNode;
	em?: (props: { children: ReactNode }) => ReactNode;
	del?: (props: { children: ReactNode }) => ReactNode;
	a?: (props: { href: string; children: ReactNode }) => ReactNode;
	img?: (props: { src: string; alt: string }) => ReactNode;
	code?: (props: { children: ReactNode }) => ReactNode;
	pre?: (props: { lang?: string; children: ReactNode }) => ReactNode;
	blockquote?: (props: { children: ReactNode }) => ReactNode;
	ul?: (props: { children: ReactNode }) => ReactNode;
	ol?: (props: { children: ReactNode }) => ReactNode;
	li?: (props: { children: ReactNode; checked?: boolean }) => ReactNode;
	input?: (props: { type: "checkbox"; checked: boolean; disabled: boolean }) => ReactNode;
	hr?: () => ReactNode;
	table?: (props: { children: ReactNode }) => ReactNode;
	thead?: (props: { children: ReactNode }) => ReactNode;
	tbody?: (props: { children: ReactNode }) => ReactNode;
	tr?: (props: { children: ReactNode }) => ReactNode;
	th?: (props: { children: ReactNode }) => ReactNode;
	td?: (props: { children: ReactNode }) => ReactNode;
	br?: () => ReactNode;
};

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
	pre: ({ children }) => <pre>{children}</pre>,
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

type RenderContext = { components: Required<Components>; directives: Directives };

function renderInlineToken(token: InlineToken, ctx: RenderContext, key: string): ReactNode {
	const { components, directives } = ctx;
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
			const Component = directives[token.name];
			return Component ? <Component key={key} {...token.props} /> : null;
		}
		case "br":
			return <components.br key={key} />;
	}
}

function renderInline(tokens: InlineToken[], ctx: RenderContext, prefix: string): ReactNode {
	return tokens.map((token, i) => renderInlineToken(token, ctx, `${prefix}-i${i}`));
}

function renderList(ordered: boolean, items: ListItem[], ctx: RenderContext, key: string): ReactNode {
	const { components } = ctx;
	const Tag = ordered ? components.ol : components.ul;
	return (
		<Tag key={key}>
			{items.map((item, i) => {
				const liKey = `${key}-li${i}`;
				return (
					<components.li key={liKey} checked={item.checked}>
						{item.checked !== undefined && <components.input type="checkbox" checked={item.checked} disabled />}
						{renderInline(item.children, ctx, liKey)}
						{item.sublist && renderList(item.sublist.ordered, item.sublist.items, ctx, `${liKey}-sub`)}
					</components.li>
				);
			})}
		</Tag>
	);
}

function renderBlock(token: BlockToken, ctx: RenderContext, key: string): ReactNode {
	const { components, directives } = ctx;

	switch (token.type) {
		case "directive_container": {
			const Component = directives[token.name];
			return Component ? (
				<Component key={key} {...token.props}>
					{renderBlocks(token.children, ctx)}
				</Component>
			) : null;
		}
		case "directive_leaf": {
			const Component = directives[token.name];
			return Component ? <Component key={key} {...token.props} /> : null;
		}
		case "heading": {
			const Tag = components[`h${token.level}`];
			return <Tag key={key}>{renderInline(token.children, ctx, key)}</Tag>;
		}
		case "paragraph":
			return <components.p key={key}>{renderInline(token.children, ctx, key)}</components.p>;
		case "small_text":
			return <components.small key={key}>{renderInline(token.children, ctx, key)}</components.small>;
		case "blockquote":
			return <components.blockquote key={key}>{renderBlocks(token.children, ctx)}</components.blockquote>;
		case "hr":
			return <components.hr key={key} />;
		case "code_block":
			return (
				<components.pre key={key} lang={token.lang}>
					<components.code>{token.content}</components.code>
				</components.pre>
			);
		case "list":
			return renderList(token.ordered, token.items, ctx, key);
		case "table":
			return (
				<components.table key={key}>
					<components.thead>
						<components.tr>
							{token.headers.map((cell, i) => (
								<components.th key={`${key}-th${i.toString()}`}>
									{renderInline(cell, ctx, `${key}-th${i.toString()}`)}
								</components.th>
							))}
						</components.tr>
					</components.thead>
					<components.tbody>
						{token.rows.map((row, ri) => (
							<components.tr key={`${key}-tr${ri.toString()}`}>
								{row.map((cell, ci) => (
									<components.td key={`${key}-tr${ri}-td${ci.toString()}`}>
										{renderInline(cell, ctx, `${key}-tr${ri}-td${ci.toString()}`)}
									</components.td>
								))}
							</components.tr>
						))}
					</components.tbody>
				</components.table>
			);
	}
}

function renderBlocks(tokens: Document, ctx: RenderContext): ReactNode {
	return tokens.map((token, i) => renderBlock(token, ctx, `b${i}`));
}

export function render(tokens: Document, components: Components = {}, directives: Directives = {}): ReactNode {
	return renderBlocks(tokens, { components: { ...defaults, ...components }, directives });
}

export function RawMarkdown({ content, directives }: { content?: string; directives?: Directives }): ReactNode {
	if (!content) return null;
	return render(tokenize(content), {}, directives);
}
