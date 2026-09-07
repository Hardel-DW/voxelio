import { splitLines } from "./lexer";
import type { Frontmatter } from "./types";

const FENCE = "---";

function unquote(value: string): string {
	const quote = value[0];
	const quoted = (quote === '"' || quote === "'") && value.length > 1 && value.endsWith(quote);
	return quoted ? value.slice(1, -1) : value;
}

function readFields(lines: string[]): Record<string, string> {
	const data: Record<string, string> = {};
	for (const line of lines) {
		const colon = line.indexOf(":");
		if (colon === -1) continue;
		data[line.slice(0, colon).trim()] = unquote(line.slice(colon + 1).trim());
	}
	return data;
}

export function parseFrontmatter(markdown: string): Frontmatter {
	const lines = splitLines(markdown);
	const end = lines[0] === FENCE ? lines.indexOf(FENCE, 1) : -1;
	if (end === -1) return { data: {}, body: markdown };
	return { data: readFields(lines.slice(1, end)), body: lines.slice(end + 1).join("\n") };
}
