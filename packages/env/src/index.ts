import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const MAX_FILE_SIZE = 1024 * 1024;
const LINE_REGEX = /^\s*(?:export\s+)?([\w.-]+)\s*=\s*(.*)?\s*$/;

export interface ParsedEnv {
	[key: string]: string;
}

export interface ConfigOptions {
	/**
	 * Path to .env file. Defaults to `.env` in current working directory.
	 * @default '.env'
	 */
	path?: string;

	/**
	 * Override existing environment variables.
	 * @default false
	 */
	override?: boolean;
}

/**
 * Remove quotes from a value and handle escape sequences
 */
function unquote(value: string): string {
	const trimmed = value.trim();
	if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
		return trimmed.slice(1, -1).replace(/\\n/g, "\n").replace(/\\r/g, "\r");
	}

	if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
		return trimmed.slice(1, -1);
	}

	const commentIndex = trimmed.indexOf("#");
	if (commentIndex !== -1) {
		return trimmed.slice(0, commentIndex).trim();
	}

	return trimmed;
}

/**
 * Parse a .env file content into an object.
 * @param src - The content of a .env file as string or Buffer
 * @returns Parsed environment variables as key-value pairs
 * @throws {Error} If file content exceeds MAX_FILE_SIZE
 */
function parse(src: string | Buffer): ParsedEnv {
	const content = typeof src === "string" ? src : src.toString("utf-8");
	if (content.length > MAX_FILE_SIZE) {
		throw new Error(`File too large: ${content.length} bytes (max: ${MAX_FILE_SIZE})`);
	}

	const result: ParsedEnv = {};
	const lines = content.replace(/\r\n?/g, "\n").split("\n");

	for (const line of lines) {
		if (!line.trim() || line.trim().startsWith("#")) {
			continue;
		}

		const match = line.match(LINE_REGEX);
		if (!match) {
			continue;
		}

		const [, key, value = ""] = match;
		result[key] = unquote(value);
	}

	return result;
}

/**
 * Load environment variables from a .env file into process.env.
 * @param options - Configuration options
 * @returns Parsed environment variables
 * @throws {Error} If file cannot be read or parsed
 * ```
 */
export function config(options: ConfigOptions = {}): ParsedEnv {
	const { path = ".env", override = false } = options;
	const resolvedPath = resolve(process.cwd(), path);

	try {
		const content = readFileSync(resolvedPath, "utf-8");
		const parsed = parse(content);
		for (const key of Object.keys(parsed)) {
			if (override || !(key in process.env)) {
				process.env[key] = parsed[key];
			}
		}

		return parsed;
	} catch (err) {
		const error = err as NodeJS.ErrnoException;
		throw new Error(`Failed to load .env file at ${path}: ${error.message}`);
	}
}
