import type { DependencyGraph, DependencyNode, McdocType, VanillaMcdocSymbols } from "@/types";
import { getReferences } from "@/traverse";

interface ParsedFile {
	id: string;
	registry: string;
	data: unknown;
}

const TWO_LEVEL_REGISTRIES = ["worldgen", "tags"];
export class PackGraph {
	private files: Record<string, Uint8Array>;
	private symbols: VanillaMcdocSymbols;
	private version: string;
	private graph: DependencyGraph = new Map();
	private parsedFiles: Map<string, ParsedFile> = new Map();
	private knownIds: Set<string> = new Set();

	constructor(files: Record<string, Uint8Array>, symbols: VanillaMcdocSymbols, version: string) {
		this.files = files;
		this.symbols = symbols;
		this.version = version;
		this.indexFiles();
	}

	generateAll(): DependencyGraph {
		for (const id of this.knownIds) {
			this.computeRefs(id);
		}
		this.buildReferencedBy();
		return this.graph;
	}

	getSubgraph(targetId: string, depth: number): DependencyGraph {
		const subgraph: DependencyGraph = new Map();
		const visited = new Set<string>();
		const queue: { id: string; d: number }[] = [{ id: targetId, d: 0 }];

		while (queue.length > 0) {
			const item = queue.shift();
			if (!item || visited.has(item.id)) continue;
			visited.add(item.id);

			this.computeRefs(item.id);
			const node = this.graph.get(item.id);
			if (!node) continue;

			subgraph.set(item.id, { refs: new Set(node.refs), referencedBy: new Set() });
			if (item.d < depth) {
				for (const refId of node.refs) {
					if (!visited.has(refId)) queue.push({ id: refId, d: item.d + 1 });
				}
			}
		}

		for (const [id, node] of subgraph) {
			for (const refId of node.refs) {
				const refNode = subgraph.get(refId);
				if (refNode) refNode.referencedBy.add(id);
			}
		}

		this.computeReferencedByFor(targetId, subgraph, depth);
		return subgraph;
	}

	canBeDeleted(targetId: string): boolean {
		for (const id of this.knownIds) {
			if (id === targetId) continue;
			this.computeRefs(id);
			const node = this.graph.get(id);
			if (node?.refs.has(targetId)) return false;
		}
		return true;
	}

	updateFile(targetId: string, data: Uint8Array): void {
		const parsed = this.parsedFiles.get(targetId);
		if (!parsed) return;

		const oldNode = this.graph.get(targetId);
		const oldRefs = oldNode ? new Set(oldNode.refs) : new Set<string>();

		parsed.data = JSON.parse(new TextDecoder().decode(data));
		this.graph.delete(targetId);
		this.computeRefs(targetId);

		const newNode = this.graph.get(targetId);
		const newRefs = newNode ? newNode.refs : new Set<string>();

		for (const refId of oldRefs) {
			if (!newRefs.has(refId)) {
				const refNode = this.graph.get(refId);
				if (refNode) refNode.referencedBy.delete(targetId);
			}
		}

		for (const refId of newRefs) {
			if (!oldRefs.has(refId)) {
				const refNode = this.graph.get(refId);
				if (refNode) refNode.referencedBy.add(targetId);
			}
		}
	}

	deleteFile(targetId: string): void {
		const node = this.graph.get(targetId);
		if (node) {
			for (const refId of node.refs) {
				const refNode = this.graph.get(refId);
				if (refNode) refNode.referencedBy.delete(targetId);
			}
		}

		this.graph.delete(targetId);
		this.parsedFiles.delete(targetId);
		this.knownIds.delete(targetId);
	}

	getGraph(): DependencyGraph {
		return this.graph;
	}

	private indexFiles(): void {
		for (const [path, content] of Object.entries(this.files)) {
			const parsed = this.parseFilePath(path);
			if (!parsed) continue;

			try {
				const data = JSON.parse(new TextDecoder().decode(content));
				this.parsedFiles.set(parsed.id, { id: parsed.id, registry: parsed.registry, data });
				this.knownIds.add(parsed.id);
			} catch {}
		}
	}

	private parseFilePath(path: string): { id: string; registry: string } | undefined {
		if (!path.endsWith(".json")) return undefined;

		const parts = path.split("/");
		if (parts.length < 4 || parts[0] !== "data") return undefined;
		const namespace = parts[1];
		const firstFolder = parts[2];
		const depth = TWO_LEVEL_REGISTRIES.includes(firstFolder) ? 2 : 1;

		if (parts.length < 3 + depth) return undefined;
		const registry = parts.slice(2, 2 + depth).join("/");
		const resource = parts
			.slice(2 + depth)
			.join("/")
			.replace(".json", "");

		if (!namespace || !registry || !resource) return undefined;
		return { id: `${namespace}:${resource}`, registry };
	}

	private computeRefs(id: string): void {
		if (this.graph.has(id)) return;

		const parsed = this.parsedFiles.get(id);
		const node: DependencyNode = { refs: new Set(), referencedBy: new Set() };
		this.graph.set(id, node);

		if (!parsed) return;
		const schema = this.getSchemaForRegistry(parsed.registry);

		if (!schema) return;
		const refs = getReferences(parsed.data, schema, this.symbols, this.version);
		for (const ref of refs) {
			const refId = ref.value.startsWith("#") ? ref.value.slice(1) : ref.value;
			if (this.knownIds.has(refId)) {
				node.refs.add(refId);
			}
		}
	}

	private buildReferencedBy(): void {
		for (const [id, node] of this.graph) {
			for (const refId of node.refs) {
				const refNode = this.graph.get(refId);
				if (refNode) refNode.referencedBy.add(id);
			}
		}
	}

	private computeReferencedByFor(targetId: string, subgraph: DependencyGraph, depth: number): void {
		const visited = new Set<string>();
		const queue: { id: string; d: number }[] = [{ id: targetId, d: 0 }];

		while (queue.length > 0) {
			const item = queue.shift();
			if (!item || visited.has(item.id)) continue;
			visited.add(item.id);

			for (const otherId of this.knownIds) {
				if (otherId === item.id) continue;
				this.computeRefs(otherId);
				const otherNode = this.graph.get(otherId);
				if (otherNode?.refs.has(item.id)) {
					if (!subgraph.has(otherId)) {
						subgraph.set(otherId, { refs: new Set(), referencedBy: new Set() });
					}
					subgraph.get(item.id)?.referencedBy.add(otherId);

					if (item.d < depth && !visited.has(otherId)) {
						queue.push({ id: otherId, d: item.d + 1 });
					}
				}
			}
		}
	}

	private getSchemaForRegistry(registry: string): McdocType | undefined {
		const dispatcher = this.symbols["mcdoc/dispatcher"]["minecraft:resource"];

		if (dispatcher) {
			const key = registry.includes(":") ? registry.split(":")[1] : registry;
			if (dispatcher[key]) return dispatcher[key];
		}

		if (registry.startsWith("tags/")) {
			return this.createTagSchema(registry.slice(5));
		}

		return undefined;
	}

	private createTagSchema(tagType: string): McdocType {
		return {
			kind: "struct",
			fields: [
				{
					kind: "pair",
					key: "values",
					type: {
						kind: "list",
						item: {
							kind: "string",
							attributes: [{ name: "id", value: { kind: "literal", value: { kind: "string", value: tagType } } }]
						}
					}
				}
			]
		};
	}
}
