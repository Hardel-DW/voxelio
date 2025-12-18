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
			if (knownIds.has(ref.value)) {
				node.refs.add(ref.value);
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

/**
 * Try dispatcher first: minecraft:resource[registry]
 * Fallback: search in mcdoc for common patterns
 */
function getSchemaForRegistry(registry: string, symbols: VanillaMcdocSymbols): McdocType | undefined {
	const dispatcherKey = `minecraft:resource`;
	const dispatcher = symbols["mcdoc/dispatcher"][dispatcherKey];

	if (dispatcher) {
		const key = registry.includes(":") ? registry.split(":")[1] : registry;
		return dispatcher[key];
	}

	const searchPaths = [`::java::data::${registry}`, `::java::data::${registry}::mod`];

	for (const path of searchPaths) {
		for (const [key, value] of Object.entries(symbols.mcdoc)) {
			if (key.startsWith(path)) {
				return value;
			}
		}
	}

	return undefined;
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
