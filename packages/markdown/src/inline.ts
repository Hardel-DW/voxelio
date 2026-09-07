import { parseProps } from "./props";
import type { DirectiveProps, InlineToken } from "./types";

const DIRECTIVE_NAME_REGEX = /^[\w.-]+/;
const AUTOLINK_REGEX = /^<(https?:\/\/[^>]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>/;
const ESCAPABLE = /^[`*_{}[\]()#+\-.!~<>]/;
const WORD = /\w/;

type ParseResult = { length: number; token: InlineToken } | null;
type Parser = (text: string, pos: number) => ParseResult;

function findClosing(text: string, start: number, open: string, close: string): number {
	let depth = 1;
	let pos = start;
	while (pos < text.length) {
		if (text[pos] === "\\") {
			pos += 2;
			continue;
		}
		if (text[pos] === open) depth++;
		else if (text[pos] === close && --depth === 0) return pos;
		pos++;
	}
	return -1;
}

function isSafeUrl(url: string): boolean {
	const lower = url.trimStart().toLowerCase();
	return !lower.startsWith("javascript:") && !lower.startsWith("vbscript:");
}

function bracketed(text: string, pos: number): { label: string; target: string; end: number } | null {
	const labelEnd = findClosing(text, pos + 1, "[", "]");
	if (labelEnd === -1 || text[labelEnd + 1] !== "(") return null;
	const targetEnd = findClosing(text, labelEnd + 2, "(", ")");
	if (targetEnd === -1) return null;
	const target = text.slice(labelEnd + 2, targetEnd);
	if (!isSafeUrl(target)) return null;
	return { label: text.slice(pos + 1, labelEnd), target, end: targetEnd + 1 };
}

function delimited(text: string, pos: number, marker: string): { inner: string; end: number } | null {
	const end = text.indexOf(marker, pos + marker.length);
	if (end === -1) return null;
	return { inner: text.slice(pos + marker.length, end), end: end + marker.length };
}

const parseEscape: Parser = (text, pos) => {
	const next = text[pos + 1];
	if (!next || !ESCAPABLE.test(next)) return null;
	return { length: 2, token: { type: "text", content: next } };
};

const parseAutolink: Parser = (text, pos) => {
	const match = AUTOLINK_REGEX.exec(text.slice(pos));
	if (!match) return null;
	const url = match[1];
	const href = url.includes("@") && !url.startsWith("http") ? `mailto:${url}` : url;
	return { length: match[0].length, token: { type: "link", href, children: [{ type: "text", content: url }] } };
};

const parseHardBreak: Parser = (text, pos) => {
	let spaces = 0;
	while (text[pos + spaces] === " ") spaces++;
	if (spaces < 2 || text[pos + spaces] !== "\n") return null;
	return { length: spaces + 1, token: { type: "br" } };
};

const parseDirective: Parser = (text, pos) => {
	if (text[pos + 1] === ":" || (pos > 0 && WORD.test(text[pos - 1]))) return null;
	const nameMatch = DIRECTIVE_NAME_REGEX.exec(text.slice(pos + 1));
	if (!nameMatch) return null;
	const name = nameMatch[0];
	let length = 1 + name.length;
	let props: DirectiveProps = {};
	const braceEnd = text[pos + length] === "{" ? text.indexOf("}", pos + length) : -1;
	if (braceEnd !== -1) {
		props = parseProps(text.slice(pos + length + 1, braceEnd));
		length = braceEnd - pos + 1;
	}
	return { length, token: { type: "directive", name, props } };
};

const parseImage: Parser = (text, pos) => {
	if (text[pos + 1] !== "[") return null;
	const image = bracketed(text, pos + 1);
	if (!image) return null;
	return { length: image.end - pos, token: { type: "image", alt: image.label, src: image.target } };
};

const parseLink: Parser = (text, pos) => {
	const link = bracketed(text, pos);
	if (!link) return null;
	return { length: link.end - pos, token: { type: "link", href: link.target, children: parseInline(link.label) } };
};

const parseBold: Parser = (text, pos) => {
	const bold = delimited(text, pos, "**");
	if (!bold) return null;
	return { length: bold.end - pos, token: { type: "bold", children: parseInline(bold.inner) } };
};

const parseItalic: Parser = (text, pos) => {
	const italic = delimited(text, pos, "*");
	if (!italic) return null;
	return { length: italic.end - pos, token: { type: "italic", children: parseInline(italic.inner) } };
};

const parseStrike: Parser = (text, pos) => {
	const strike = delimited(text, pos, "~~");
	if (!strike) return null;
	return { length: strike.end - pos, token: { type: "strike", children: parseInline(strike.inner) } };
};

const parseCode: Parser = (text, pos) => {
	const code = delimited(text, pos, "`");
	if (!code) return null;
	return { length: code.end - pos, token: { type: "code", content: code.inner } };
};

const PARSERS = new Map<string, Parser>([
	["\\", parseEscape],
	["<", parseAutolink],
	[" ", parseHardBreak],
	[":", parseDirective],
	["!", parseImage],
	["[", parseLink],
	["*", (text, pos) => (text[pos + 1] === "*" ? parseBold(text, pos) : parseItalic(text, pos))],
	["~", (text, pos) => (text[pos + 1] === "~" ? parseStrike(text, pos) : null)],
	["`", parseCode]
]);

export function parseInline(text: string): InlineToken[] {
	const tokens: InlineToken[] = [];
	let start = 0;
	let pos = 0;
	while (pos < text.length) {
		const result = PARSERS.get(text[pos])?.(text, pos);
		if (!result) {
			pos++;
			continue;
		}
		if (pos > start) tokens.push({ type: "text", content: text.slice(start, pos) });
		tokens.push(result.token);
		pos += result.length;
		start = pos;
	}
	if (pos > start) tokens.push({ type: "text", content: text.slice(start, pos) });
	return tokens;
}

export function plainText(tokens: InlineToken[]): string {
	let text = "";
	for (const token of tokens) {
		if ("content" in token) text += token.content;
		else if ("children" in token) text += plainText(token.children);
		else if (token.type === "image") text += token.alt;
	}
	return text;
}
