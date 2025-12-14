import { MAX_ITERATIONS, parseProps } from "./lexer";
import type { DirectiveProps, InlineToken } from "./types";

const DIRECTIVE_NAME_REGEX = /^[\w.-]+/;
const AUTOLINK_REGEX = /^<(https?:\/\/[^>]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>/;
const ESCAPABLE = /^[\\`*_{}[\]()#+\-.!~<>]/;

function findClosing(text: string, start: number, open: string, close: string): number {
	let depth = 1;
	let pos = start;
	while (pos < text.length && depth > 0) {
		if (text[pos] === "\\" && pos + 1 < text.length) {
			pos += 2;
			continue;
		}
		if (text.startsWith(open, pos)) depth++;
		else if (text.startsWith(close, pos)) depth--;
		if (depth > 0) pos++;
	}
	return depth === 0 ? pos : -1;
}

function isSafeUrl(url: string): boolean {
	const lower = url.trimStart().toLowerCase();
	return !lower.startsWith("javascript:") && !lower.startsWith("vbscript:");
}

type ParseResult = { length: number; token: InlineToken } | null;

function tryParseEscape(text: string, pos: number): ParseResult {
	if (text[pos] !== "\\") return null;
	const next = text[pos + 1];
	if (next && ESCAPABLE.test(next)) {
		return { length: 2, token: { type: "text", content: next } };
	}
	return null;
}

function tryParseAutolink(text: string, pos: number): ParseResult {
	if (text[pos] !== "<") return null;
	const match = text.slice(pos).match(AUTOLINK_REGEX);
	if (!match) return null;
	const url = match[1];
	const href = url.includes("@") && !url.startsWith("http") ? `mailto:${url}` : url;
	return { length: match[0].length, token: { type: "link", href, children: [{ type: "text", content: url }] } };
}

function tryParseHardBreak(text: string, pos: number): ParseResult {
	if (text[pos] !== " ") return null;
	let spaces = 0;
	while (text[pos + spaces] === " ") spaces++;
	if (spaces >= 2 && text[pos + spaces] === "\n") {
		return { length: spaces + 1, token: { type: "br" } };
	}
	return null;
}

function tryParseSoftBreak(text: string, pos: number): ParseResult {
	return text[pos] === "\n" ? { length: 1, token: { type: "text", content: " " } } : null;
}

function tryParseDirective(text: string, pos: number): ParseResult {
	if (text[pos] !== ":" || text[pos + 1] === ":") return null;

	const rest = text.slice(pos + 1);
	const nameMatch = rest.match(DIRECTIVE_NAME_REGEX);
	if (!nameMatch) return null;

	const name = nameMatch[0];
	let length = 1 + name.length;
	let props: DirectiveProps = {};

	if (text[pos + length] === "{") {
		const braceEnd = text.indexOf("}", pos + length);
		if (braceEnd !== -1) {
			props = parseProps(text.slice(pos + length + 1, braceEnd));
			length = braceEnd - pos + 1;
		}
	}

	return { length, token: { type: "directive", name, props } };
}

function tryParseImage(text: string, pos: number): ParseResult {
	if (text[pos] !== "!" || text[pos + 1] !== "[") return null;

	const altEnd = findClosing(text, pos + 2, "[", "]");
	if (altEnd === -1 || text[altEnd + 1] !== "(") return null;

	const srcEnd = text.indexOf(")", altEnd + 2);
	if (srcEnd === -1) return null;

	const src = text.slice(altEnd + 2, srcEnd);
	if (!isSafeUrl(src)) return null;

	return { length: srcEnd - pos + 1, token: { type: "image", alt: text.slice(pos + 2, altEnd), src } };
}

function tryParseLink(text: string, pos: number): ParseResult {
	if (text[pos] !== "[") return null;

	const textEnd = findClosing(text, pos + 1, "[", "]");
	if (textEnd === -1 || text[textEnd + 1] !== "(") return null;

	const hrefEnd = text.indexOf(")", textEnd + 2);
	if (hrefEnd === -1) return null;

	const href = text.slice(textEnd + 2, hrefEnd);
	if (!isSafeUrl(href)) return null;

	return { length: hrefEnd - pos + 1, token: { type: "link", href, children: parseInline(text.slice(pos + 1, textEnd)) } };
}

function tryParseBold(text: string, pos: number): ParseResult {
	if (text[pos] !== "*" || text[pos + 1] !== "*") return null;
	const end = text.indexOf("**", pos + 2);
	if (end === -1) return null;
	return { length: end - pos + 2, token: { type: "bold", children: parseInline(text.slice(pos + 2, end)) } };
}

function tryParseItalic(text: string, pos: number): ParseResult {
	if (text[pos] !== "*" || text[pos + 1] === "*") return null;
	const end = text.indexOf("*", pos + 1);
	if (end === -1) return null;
	return { length: end - pos + 1, token: { type: "italic", children: parseInline(text.slice(pos + 1, end)) } };
}

function tryParseStrike(text: string, pos: number): ParseResult {
	if (text[pos] !== "~" || text[pos + 1] !== "~") return null;
	const end = text.indexOf("~~", pos + 2);
	if (end === -1) return null;
	return { length: end - pos + 2, token: { type: "strike", children: parseInline(text.slice(pos + 2, end)) } };
}

function tryParseCode(text: string, pos: number): ParseResult {
	if (text[pos] !== "`") return null;
	const end = text.indexOf("`", pos + 1);
	if (end === -1) return null;
	return { length: end - pos + 1, token: { type: "code", content: text.slice(pos + 1, end) } };
}

export function parseInline(text: string): InlineToken[] {
	const tokens: InlineToken[] = [];
	const buffer: string[] = [];
	let pos = 0;
	let iterations = 0;
	const flushBuffer = () => {
		if (buffer.length) {
			tokens.push({ type: "text", content: buffer.join("") });
			buffer.length = 0;
		}
	};

	const parsers: Record<string, (t: string, p: number) => ParseResult> = {
		"\\": tryParseEscape,
		"<": tryParseAutolink,
		" ": tryParseHardBreak,
		"\n": tryParseSoftBreak,
		":": tryParseDirective,
		"!": tryParseImage,
		"[": tryParseLink,
		"*": (t, p) => tryParseBold(t, p) ?? tryParseItalic(t, p),
		"~": tryParseStrike,
		"`": tryParseCode
	};

	while (pos < text.length) {
		if (++iterations > MAX_ITERATIONS) throw new Error("Inline parser limit exceeded");
		const result = parsers[text[pos]]?.(text, pos);
		if (result) {
			flushBuffer();
			tokens.push(result.token);
			pos += result.length;
		} else {
			buffer.push(text[pos++]);
		}
	}

	flushBuffer();
	return tokens;
}
