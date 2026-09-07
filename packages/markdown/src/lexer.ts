import { parseInline } from "./inline";
import { parseProps } from "./props";
import type { BlockToken, DirectiveProps, HeadingLevel, InlineToken, ListItem, ListToken } from "./types";

const HR_REGEX = /^(-{3,}|\*{3,}|_{3,})$/;
const TABLE_SEPARATOR_REGEX = /^\|?[\s:]*-+[\s:]*(\|[\s:]*-+[\s:]*)*\|?$/;
const ORDERED_LIST_REGEX = /^(\s*)\d+\.\s/;
const UNORDERED_LIST_REGEX = /^(\s*)[-*]\s/;
const TASK_REGEX = /^\[([ xX])\]\s/;
const FENCE = "```";
const CONTAINER_CLOSE = ":::";

export const splitLines = (text: string): string[] => text.replace(/\r\n?/g, "\n").split("\n");

type Cursor = { lines: string[]; index: number };
type ListMarker = { indent: number; ordered: boolean; content: string };
type Directive = { container: boolean; name: string; props: DirectiveProps };

const current = (cursor: Cursor): string => cursor.lines[cursor.index];
const isBlank = (line: string): boolean => !line.trim();

function parseDirectiveHeader(line: string): Directive | null {
	const colons = line.startsWith(CONTAINER_CLOSE) ? 3 : line.startsWith("::") ? 2 : 0;
	if (!colons) return null;
	const rest = line.slice(colons);
	const braceStart = rest.indexOf("{");
	const braceEnd = rest.lastIndexOf("}");
	if (braceStart === -1 || braceEnd < braceStart) return { container: colons === 3, name: rest.trim(), props: {} };
	return { container: colons === 3, name: rest.slice(0, braceStart).trim(), props: parseProps(rest.slice(braceStart + 1, braceEnd)) };
}

const HEADING_LEVELS: HeadingLevel[] = [1, 2, 3, 4, 5, 6];

function headingLevel(line: string): HeadingLevel | null {
	let level = 0;
	while (line[level] === "#") level++;
	return level >= 1 && level <= 6 && line[level] === " " ? HEADING_LEVELS[level - 1] : null;
}

function listMarker(line: string): ListMarker | null {
	const ordered = ORDERED_LIST_REGEX.exec(line);
	const match = ordered ?? UNORDERED_LIST_REGEX.exec(line);
	if (!match) return null;
	return { indent: match[1].length, ordered: ordered !== null, content: line.slice(match[0].length) };
}

function isBlockStart(line: string): boolean {
	return (
		line.startsWith("::") ||
		HR_REGEX.test(line.trim()) ||
		line[0] === "#" ||
		line.startsWith("-# ") ||
		line[0] === ">" ||
		line.startsWith(FENCE) ||
		line[0] === "|" ||
		listMarker(line) !== null
	);
}

function splitTableCells(line: string): InlineToken[][] {
	const trimmed = line.trim();
	const inner = trimmed.slice(trimmed.startsWith("|") ? 1 : 0, trimmed.endsWith("|") ? -1 : undefined);
	return inner.split("|").map((cell) => parseInline(cell.trim()));
}

function collect(cursor: Cursor, accept: (line: string) => boolean): string[] {
	const start = cursor.index;
	while (cursor.index < cursor.lines.length && accept(current(cursor))) cursor.index++;
	return cursor.lines.slice(start, cursor.index);
}

function parseDirective(cursor: Cursor, directive: Directive): BlockToken {
	cursor.index++;
	if (!directive.container) return { type: "directive_leaf", name: directive.name, props: directive.props };
	return {
		type: "directive_container",
		name: directive.name,
		props: directive.props,
		children: parseBlocks(cursor, (line) => line === CONTAINER_CLOSE)
	};
}

function parseCodeBlock(cursor: Cursor): BlockToken {
	const [lang, ...meta] = current(cursor).slice(FENCE.length).trim().split(/\s+/);
	cursor.index++;
	const content = collect(cursor, (line) => !line.startsWith(FENCE)).join("\n");
	cursor.index++;
	return { type: "code_block", lang: lang || undefined, meta: parseProps(meta.join(" ")), content };
}

function parseBlockquote(cursor: Cursor): BlockToken {
	const lines = collect(cursor, (line) => line[0] === ">").map((line) => line.slice(1).trimStart());
	return { type: "blockquote", children: tokenize(lines.join("\n")) };
}

function parseTable(cursor: Cursor): BlockToken {
	const headers = splitTableCells(current(cursor));
	cursor.index += 2;
	const rows = collect(cursor, (line) => !isBlank(line) && line.includes("|")).map(splitTableCells);
	return { type: "table", headers, rows };
}

function parseListItem(marker: ListMarker): ListItem {
	const task = TASK_REGEX.exec(marker.content);
	if (!task) return { children: parseInline(marker.content) };
	return { checked: task[1].toLowerCase() === "x", children: parseInline(marker.content.slice(task[0].length)) };
}

function parseList(cursor: Cursor, first: ListMarker): ListToken {
	const items = [parseListItem(first)];
	cursor.index++;
	while (cursor.index < cursor.lines.length) {
		const marker = listMarker(current(cursor));
		if (!marker || marker.indent < first.indent || (marker.indent === first.indent && marker.ordered !== first.ordered)) break;
		if (marker.indent > first.indent) {
			items[items.length - 1].sublist = parseList(cursor, marker);
			continue;
		}
		items.push(parseListItem(marker));
		cursor.index++;
	}
	return { type: "list", ordered: first.ordered, items };
}

function parseParagraph(cursor: Cursor): BlockToken {
	const first = current(cursor);
	cursor.index++;
	const rest = collect(cursor, (line) => !isBlank(line) && !isBlockStart(line));
	return { type: "paragraph", children: parseInline([first, ...rest].join("\n")) };
}

function consume(cursor: Cursor, block: BlockToken): BlockToken {
	cursor.index++;
	return block;
}

function parseBlock(cursor: Cursor): BlockToken {
	const line = current(cursor);
	const directive = parseDirectiveHeader(line);
	if (directive) return parseDirective(cursor, directive);
	if (line.startsWith(FENCE)) return parseCodeBlock(cursor);
	const level = headingLevel(line);
	if (level) return consume(cursor, { type: "heading", level, children: parseInline(line.slice(level + 1)) });
	if (HR_REGEX.test(line.trim())) return consume(cursor, { type: "hr" });
	if (line.startsWith("-# ")) return consume(cursor, { type: "small_text", children: parseInline(line.slice(3)) });
	if (line[0] === ">") return parseBlockquote(cursor);
	if (line[0] === "|" && TABLE_SEPARATOR_REGEX.test(cursor.lines[cursor.index + 1]?.trim() ?? "")) return parseTable(cursor);
	const marker = listMarker(line);
	if (marker) return parseList(cursor, marker);
	return parseParagraph(cursor);
}

function parseBlocks(cursor: Cursor, isEnd: (line: string) => boolean): BlockToken[] {
	const blocks: BlockToken[] = [];
	while (cursor.index < cursor.lines.length) {
		const line = current(cursor);
		if (isEnd(line)) {
			cursor.index++;
			return blocks;
		}
		if (isBlank(line)) cursor.index++;
		else blocks.push(parseBlock(cursor));
	}
	return blocks;
}

export function tokenize(markdown: string): BlockToken[] {
	return parseBlocks({ lines: splitLines(markdown), index: 0 }, () => false);
}
