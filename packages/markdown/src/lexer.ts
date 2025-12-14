import { parseInline } from "./inline";
import type { DirectiveProps, Document, ListItem } from "./types";

export const MAX_ITERATIONS = 100_000;
const HR_REGEX = /^-{3,}$/;
const TABLE_SEPARATOR_REGEX = /^\|?[\s:]*-{3,}[\s:]*(\|[\s:]*-{3,}[\s:]*)*\|?$/;
const ORDERED_LIST_REGEX = /^(\s*)(\d+)\.\s/;
const UNORDERED_LIST_REGEX = /^(\s*)[-*]\s/;
const TASK_REGEX = /^\[([ xX])\]\s/;

export function parseProps(raw: string): DirectiveProps {
	const props: DirectiveProps = {};
	let pos = 0;
	while (pos < raw.length) {
		while (pos < raw.length && (raw[pos] === " " || raw[pos] === ",")) pos++;
		if (pos >= raw.length) break;

		const keyStart = pos;
		while (pos < raw.length && raw[pos] !== "=") pos++;
		const key = raw.slice(keyStart, pos).trim();
		if (!key || pos >= raw.length) break;

		pos++;
		const quote = raw[pos];
		if (quote === '"' || quote === "'") {
			pos++;
			const valueStart = pos;
			while (pos < raw.length && raw[pos] !== quote) pos++;
			props[key] = raw.slice(valueStart, pos);
			pos++;
		} else {
			const valueStart = pos;
			while (pos < raw.length && raw[pos] !== " " && raw[pos] !== ",") pos++;
			props[key] = raw.slice(valueStart, pos);
		}
	}
	return props;
}

function parseDirectiveHeader(line: string): { type: "leaf" | "container"; name: string; props: DirectiveProps } | null {
	const colonCount = line.startsWith(":::") ? 3 : line.startsWith("::") ? 2 : 0;
	if (!colonCount) return null;

	const rest = line.slice(colonCount);
	const braceStart = rest.indexOf("{");
	if (braceStart === -1) return { type: colonCount === 3 ? "container" : "leaf", name: rest.trim(), props: {} };

	const braceEnd = rest.lastIndexOf("}");
	if (braceEnd === -1) return null;

	return {
		type: colonCount === 3 ? "container" : "leaf",
		name: rest.slice(0, braceStart).trim(),
		props: parseProps(rest.slice(braceStart + 1, braceEnd))
	};
}

function parseHeading(line: string): { level: 1 | 2 | 3 | 4 | 5 | 6; content: string } | null {
	if (line[0] !== "#") return null;
	let level = 0;
	while (level < line.length && line[level] === "#") level++;
	if (level < 1 || level > 6 || line[level] !== " ") return null;
	return { level: level as 1 | 2 | 3 | 4 | 5 | 6, content: line.slice(level + 1) };
}

function isBlockStart(line: string): boolean {
	const c = line[0];
	return (
		line.startsWith("::") ||
		HR_REGEX.test(line.trim()) ||
		c === "#" ||
		line.startsWith("-# ") ||
		c === ">" ||
		line.startsWith("```") ||
		c === "|" ||
		ORDERED_LIST_REGEX.test(line) ||
		UNORDERED_LIST_REGEX.test(line)
	);
}

function splitTableCells(line: string): string[] {
	const trimmed = line.trim();
	const content = trimmed.startsWith("|") ? trimmed.slice(1) : trimmed;
	const final = content.endsWith("|") ? content.slice(0, -1) : content;
	return final.split("|").map((c) => c.trim());
}

function parseListItem(content: string): { checked?: boolean; text: string } {
	const taskMatch = content.match(TASK_REGEX);
	if (taskMatch) {
		return { checked: taskMatch[1].toLowerCase() === "x", text: content.slice(taskMatch[0].length) };
	}
	return { text: content };
}

function parseList(lines: string[], startIndex: number, baseIndent: number): { items: ListItem[]; endIndex: number; ordered: boolean } {
	const items: ListItem[] = [];
	let i = startIndex;
	const firstLine = lines[i];
	const ordered = ORDERED_LIST_REGEX.test(firstLine);
	const listRegex = ordered ? ORDERED_LIST_REGEX : UNORDERED_LIST_REGEX;

	while (i < lines.length) {
		const line = lines[i];
		const match = line.match(listRegex);
		if (!match) break;

		const indent = match[1].length;
		if (indent < baseIndent) break;
		if (indent > baseIndent) {
			if (items.length > 0) {
				const nested = parseList(lines, i, indent);
				items[items.length - 1].sublist = { ordered: nested.ordered, items: nested.items };
				i = nested.endIndex;
			} else {
				i++;
			}
			continue;
		}

		const content = line.replace(listRegex, "");
		const { checked, text } = parseListItem(content);
		items.push({ checked, children: parseInline(text) });
		i++;
	}

	return { items, endIndex: i, ordered };
}

export function tokenize(markdown: string): Document {
	const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
	const tokens: Document = [];
	let i = 0;
	let iterations = 0;

	while (i < lines.length) {
		if (++iterations > MAX_ITERATIONS) throw new Error("Lexer limit exceeded");

		const line = lines[i];
		if (!line.trim()) {
			i++;
			continue;
		}

		// Directives
		const directive = parseDirectiveHeader(line);
		if (directive) {
			i++;
			if (directive.type === "leaf") {
				tokens.push({ type: "directive_leaf", name: directive.name, props: directive.props });
			} else {
				const childLines: string[] = [];
				while (i < lines.length && lines[i] !== ":::") {
					childLines.push(lines[i]);
					i++;
				}
				tokens.push({
					type: "directive_container",
					name: directive.name,
					props: directive.props,
					children: tokenize(childLines.join("\n"))
				});
				if (i < lines.length) i++;
			}
			continue;
		}

		// Code block
		if (line.startsWith("```")) {
			const lang = line.slice(3).trim() || undefined;
			const content: string[] = [];
			i++;
			while (i < lines.length && !lines[i].startsWith("```")) {
				content.push(lines[i]);
				i++;
			}
			tokens.push({ type: "code_block", lang, content: content.join("\n") });
			if (i < lines.length) i++;
			continue;
		}

		// Heading
		const heading = parseHeading(line);
		if (heading) {
			tokens.push({ type: "heading", level: heading.level, children: parseInline(heading.content) });
			i++;
			continue;
		}

		// Horizontal rule
		if (HR_REGEX.test(line.trim())) {
			tokens.push({ type: "hr" });
			i++;
			continue;
		}

		// Small text
		if (line.startsWith("-# ")) {
			tokens.push({ type: "small_text", children: parseInline(line.slice(3)) });
			i++;
			continue;
		}

		// Blockquote
		if (line[0] === ">") {
			const quoteLines: string[] = [];
			while (i < lines.length && lines[i][0] === ">") {
				quoteLines.push(lines[i].slice(1).trimStart());
				i++;
			}
			tokens.push({ type: "blockquote", children: tokenize(quoteLines.join("\n")) });
			continue;
		}

		// Table
		if (line[0] === "|" && TABLE_SEPARATOR_REGEX.test(lines[i + 1]?.trim() ?? "")) {
			const headers = splitTableCells(line).map((c) => parseInline(c));
			i += 2;
			const rows: ReturnType<typeof parseInline>[][] = [];
			while (i < lines.length && lines[i].includes("|")) {
				rows.push(splitTableCells(lines[i]).map((c) => parseInline(c)));
				i++;
			}
			tokens.push({ type: "table", headers, rows });
			continue;
		}

		// Lists (ordered and unordered with nesting + tasks)
		if (ORDERED_LIST_REGEX.test(line) || UNORDERED_LIST_REGEX.test(line)) {
			const { items, endIndex, ordered } = parseList(lines, i, 0);
			tokens.push({ type: "list", ordered, items });
			i = endIndex;
			continue;
		}

		// Paragraph
		const paragraphLines: string[] = [];
		while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) {
			paragraphLines.push(lines[i]);
			i++;
		}
		if (paragraphLines.length > 0) {
			tokens.push({ type: "paragraph", children: parseInline(paragraphLines.join("\n")) });
		}
	}

	return tokens;
}
