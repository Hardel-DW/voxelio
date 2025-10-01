/**
 * Represents a Minecraft identifier object structure
 */
export type IdentifierObject = {
	namespace: string;
	registry: string;
	resource: string;
};

export class Identifier {
	readonly namespace: string;
	readonly registry: string;
	readonly resource: string;

	constructor(identifier: IdentifierObject) {
		this.namespace = identifier.namespace;
		this.registry = identifier.registry;
		this.resource = identifier.resource;
	}

	static of(identifier: string, registry: string) {
		const cleanId = identifier.startsWith("#") ? identifier.slice(1) : identifier;

		// Auto-prefix with "minecraft" if no namespace is provided
		if (!cleanId.includes(":")) {
			return new Identifier({ namespace: "minecraft", registry, resource: cleanId });
		}

		const [namespace, resource] = cleanId.split(":");
		return new Identifier({ namespace, registry, resource });
	}

	/**
	 * The Unique key is built like this:
	 * namespace:resource$registry
	 *
	 * @param uniqueKey
	 * @returns
	 */
	static fromUniqueKey(uniqueKey: string) {
		const [$namespace_resource, registry] = uniqueKey.split("$");
		const [namespace, resource] = $namespace_resource.split(":");
		return new Identifier({ namespace, registry, resource });
	}

	get(): IdentifierObject {
		return { namespace: this.namespace, registry: this.registry, resource: this.resource };
	}

	toString() {
		if (this.registry?.startsWith("tags/")) {
			return `#${this.namespace}:${this.resource}`;
		}
		return `${this.namespace}:${this.resource}`;
	}

	toUniqueKey() {
		return `${this.namespace}:${this.resource}$${this.registry}`;
	}

	equals(other: Identifier | undefined) {
		if (!other) return false;
		return this.namespace === other.namespace && this.registry === other.registry && this.resource === other.resource;
	}

	equalsObject(other: IdentifierObject | undefined) {
		if (!other) return false;
		return this.namespace === other.namespace && this.registry === other.registry && this.resource === other.resource;
	}

	/**
	 * Generates a file path for the identifier
	 * @param basePath - Base path (default: "data")
	 * @returns Full file path
	 * @example
	 * const path = id.toFilePath(); // "data/minecraft/block/stone"
	 * const modPath = id.toFilePath("mod"); // "mod/minecraft/block/stone"
	 */
	toFilePath(basePath = "data"): string {
		return `${basePath}/${this.namespace}/${this.registry}/${this.resource}.json`;
	}

	/**
	 * Generates a filename for the identifier
	 * @param extension - Add .json extension (default: false)
	 * @returns Filename
	 * @example
	 * const name = id.toFileName(); // "stone"
	 * const fullName = id.toFileName(true); // "stone.json"
	 */
	toFileName(extension = false): string {
		const filename = this.resource.split("/").pop() ?? this.resource;
		return extension ? `${filename}.json` : filename;
	}

	/**
	 * Renders namespace for display
	 * @returns Formatted namespace
	 * @example
	 * id.toNamespace(); // "Minecraft"
	 */
	toNamespace(): string {
		return this.namespace.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
	}

	/**
	 * Renders resource name from path
	 * @returns Formatted resource name
	 * @example
	 * id.toResourceName(); // "Sword" (from "items/weapons/sword")
	 * id.toResourceName(); // "Fire Sword" (from "items/weapons/fire_sword")
	 */
	toResourceName(): string {
		return this.resource
			.split("/")
			.reduce((_, current) => current)
			.replace(/_/g, " ")
			.replace(/\b\w/g, (l) => l.toUpperCase());
	}

	/**
	 * Renders full resource path for display
	 * @returns Formatted resource path
	 * @example
	 * id.toResourcePath(); // "Items - Wooden Sword" (from "items/wooden_sword")
	 */
	toResourcePath(): string {
		return this.resource
			.replace(/\//g, " - ")
			.replace(/_/g, " ")
			.replace(/\b\w/g, (l) => l.toUpperCase());
	}

	/**
	 * Renders string identifier for display
	 * @param identifier - The identifier string
	 * @returns Formatted text
	 * @example
	 * Identifier.toDisplay("minecraft:stone"); // "Stone"
	 */
	static toDisplay(identifier: string): string {
		return Identifier.of(identifier, "none").toResourceName();
	}

	/**
	 * Normalizes an identifier string to full format with namespace
	 * @param identifier - The identifier string (with or without namespace)
	 * @param registry - The registry for context
	 * @returns Normalized identifier string
	 * @example
	 * Identifier.normalize("stone", "block"); // "minecraft:stone"
	 * Identifier.normalize("modname:stone", "block"); // "modname:stone"
	 */
	static normalize(identifier: string, registry: string): string {
		return Identifier.of(identifier, registry).toString();
	}

	static isIdentifier(value: any): value is IdentifierObject {
		if (!value || typeof value !== "object") return false;

		return (
			"registry" in value &&
			"namespace" in value &&
			"resource" in value &&
			typeof value.registry === "string" &&
			typeof value.namespace === "string" &&
			typeof value.resource === "string"
		);
	}
}
