import type { DirectiveProps } from "./types";

const isSeparator = (char: string): boolean => char === " " || char === ",";

function readValue(raw: string, start: number): { value: string; end: number } {
	const quote = raw[start];
	if (quote === '"' || quote === "'") {
		const close = raw.indexOf(quote, start + 1);
		const end = close === -1 ? raw.length : close;
		return { value: raw.slice(start + 1, end), end: end + 1 };
	}
	let end = start;
	while (end < raw.length && !isSeparator(raw[end])) end++;
	return { value: raw.slice(start, end), end };
}

export function parseProps(raw: string): DirectiveProps {
	const props: DirectiveProps = {};
	let pos = 0;
	while (pos < raw.length) {
		if (isSeparator(raw[pos])) {
			pos++;
			continue;
		}
		const equals = raw.indexOf("=", pos);
		if (equals === -1) break;
		const key = raw.slice(pos, equals).trim();
		const { value, end } = readValue(raw, equals + 1);
		if (key) props[key] = value;
		pos = end;
	}
	return props;
}
