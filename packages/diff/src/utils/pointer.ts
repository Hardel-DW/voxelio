/**
 * JSON Pointer utilities (RFC 6901)
 * Adapted from rfc6902 package
 */
function unescapeToken(token: string): string {
	return token.replace(/~1/g, "/").replace(/~0/g, "~");
}

function escapeToken(token: string): string {
	return token.replace(/~/g, "~0").replace(/\//g, "~1");
}

export interface PointerEvaluation {
	parent: unknown;
	key: string;
	value: unknown;
}

export class Pointer {
	constructor(public tokens: string[] = [""]) {}

	static fromJSON(path: string): Pointer {
		const tokens = path.split("/").map(unescapeToken);
		if (tokens[0] !== "") throw new Error(`Invalid JSON Pointer: ${path}`);
		return new Pointer(tokens);
	}

	toString(): string {
		return this.tokens.map(escapeToken).join("/");
	}

	evaluate(object: unknown): PointerEvaluation {
		let parent: unknown = null;
		let key = "";
		let value = object;

		for (let i = 1; i < this.tokens.length; i++) {
			parent = value;
			key = this.tokens[i];
			if (key === "__proto__" || key === "constructor" || key === "prototype") {
				continue;
			}

			value = (parent as Record<string, unknown>)?.[key];
		}

		return { parent, key, value };
	}

	add(token: string): Pointer {
		return new Pointer([...this.tokens, String(token)]);
	}
}
