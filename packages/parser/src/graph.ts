import type { DependencyGraph, DependencyNode, McdocType, VanillaMcdocSymbols } from "./types";
import { getReferences } from "./traverse";

export interface DatapackFile {
	namespace: string;
	registry: string;
	path: string;
	data: unknown;
}

/**
 * Build a bidirectional dependency graph from datapack files.
 */
export function buildDependencyGraph(files: DatapackFile[], symbols: VanillaMcdocSymbols, version: string): DependencyGraph {
	const graph: DependencyGraph = new Map();
	const knownIds = new Set(files.map((f) => toResourceLocation(f.namespace, f.path)));

	for (const file of files) {
		const id = toResourceLocation(file.namespace, file.path);
		const schema = getSchemaForRegistry(file.registry, symbols);

		if (!schema) {
			ensureNode(graph, id);
			continue;
		}

		const refs = getReferences(file.data, schema, symbols, version);
		const node = ensureNode(graph, id);

		for (const ref of refs) {
			const refId = ref.value.startsWith("#") ? ref.value.slice(1) : ref.value;
			if (knownIds.has(refId)) {
				node.refs.add(refId);
			}
		}
	}

	for (const [id, node] of graph) {
		for (const refId of node.refs) {
			const refNode = ensureNode(graph, refId);
			refNode.referencedBy.add(id);
		}
	}

	return graph;
}

/**
 * Get direct references for a single file.
 */
export function getFileReferences(file: DatapackFile, symbols: VanillaMcdocSymbols, version: string): string[] {
	const schema = getSchemaForRegistry(file.registry, symbols);
	if (!schema) return [];

	const refs = getReferences(file.data, schema, symbols, version);
	return refs.map((r) => r.value);
}

function getSchemaForRegistry(registry: string, symbols: VanillaMcdocSymbols): McdocType | undefined {
	const dispatcher = symbols["mcdoc/dispatcher"]["minecraft:resource"];

	if (dispatcher) {
		const key = registry.includes(":") ? registry.split(":")[1] : registry;
		if (dispatcher[key]) return dispatcher[key];
	}

	if (registry.startsWith("tags/")) {
		return createTagSchema(registry.slice(5));
	}

	return undefined;
}

function createTagSchema(tagType: string): McdocType {
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
						attributes: [{ name: "id", value: { kind: "literal", value: { kind: "string", value: tagType } } }],
					},
				},
			},
		],
	};
}

function ensureNode(graph: DependencyGraph, id: string): DependencyNode {
	let node = graph.get(id);
	if (!node) {
		node = { refs: new Set(), referencedBy: new Set() };
		graph.set(id, node);
	}
	return node;
}

const toResourceLocation = (namespace: string, path: string): string => `${namespace}:${path}`;
