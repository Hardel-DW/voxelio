# Module Signature:
interface GraphNode {
    refs: Set<string>;
    referencedBy: Set<string>;
}

type Graph = Map<string, GraphNode>;

class PackGraph {
    constructor(files: Record<string, Uint8Array>, symbols: VanillaMcdocSymbols, version: string);

    /** Parse ALL files in the pack */
    generateAll(): Graph;

    /** On-demand subgraph, depth 0 = target only */
    getSubgraph(targetId: string, depth: number): Graph;

    /** True if no file references targetId */
    canBeDeleted(targetId: string): boolean;

    /** Update a file, regenerate its refs */
    updateFile(targetId: string, data: Uint8Array): void;

    /** Remove a file from the graph */
    deleteFile(targetId: string): void;

    getGraph(): Graph;
}

# Signature Usage:
const graph = new PackGraph(zipBytes, symbols, "1.21.4");

// Direct impact of a file (parse only what's needed)
const impact = graph.getSubgraph("mypack:loot/chest", 1);

// Can we delete this file?
if (graph.canBeDeleted("mypack:loot/chest")) {
    graph.deleteFile("mypack:loot/chest");
}