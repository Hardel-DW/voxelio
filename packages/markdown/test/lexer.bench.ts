import { bench, describe } from "vitest";
import { tokenize } from "../src/lexer";

function generateMixedMarkdown(lines: number): string {
	const blocks = [
		"# Heading 1",
		"## Heading 2 with **bold**",
		"This is a paragraph with *italic* and `code`.",
		"- list item 1",
		"- list item 2",
		"  - nested item",
		"1. ordered item",
		"> blockquote content",
		"[link](https://example.com) and ![img](test.png)",
		"---",
		"```js\nconst x = 1;\n```",
		"| A | B |\n|---|---|\n| 1 | 2 |"
	];
	const result: string[] = [];
	for (let i = 0; i < lines; i++) {
		result.push(blocks[i % blocks.length]);
	}
	return result.join("\n\n");
}

function generateComplexTable(rows: number): string {
	const header = "| Col1 | Col2 | Col3 | Col4 | Col5 |";
	const sep = "|------|------|------|------|------|";
	const lines = [header, sep];
	for (let i = 0; i < rows; i++) {
		lines.push(`| **bold${i}** | *italic* | \`code\` | [link](url) | text |`);
	}
	return lines.join("\n");
}

function generateNestedList(depth: number): string {
	const lines: string[] = [];
	for (let i = 0; i < depth; i++) {
		lines.push(`${"  ".repeat(i)}- level ${i}`);
	}
	return lines.join("\n");
}

function generateDenseInline(count: number): string {
	const parts: string[] = [];
	for (let i = 0; i < count; i++) {
		const type = i % 5;
		if (type === 0) parts.push(`**bold${i}**`);
		else if (type === 1) parts.push(`*italic${i}*`);
		else if (type === 2) parts.push(`\`code${i}\``);
		else if (type === 3) parts.push(`[link${i}](url)`);
		else parts.push(`~~strike${i}~~`);
	}
	return parts.join(" ");
}

const mixed10k = generateMixedMarkdown(10_000);
const table1k = generateComplexTable(1_000);
const nested10 = generateNestedList(10);
const inline1k = generateDenseInline(1_000);

const opts = { iterations: 3, warmupIterations: 1 };

describe("lexer benchmarks", () => {
	bench("10k mixed markdown lines", () => void tokenize(mixed10k), opts);
	bench("1k table rows with inline", () => void tokenize(table1k), opts);
	bench("deeply nested list (10 levels)", () => void tokenize(nested10), opts);
	bench("paragraph with 1k inline elements", () => void tokenize(inline1k), opts);
});
