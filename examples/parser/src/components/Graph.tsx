import { ReactFlow, Background, Controls, Handle, Position, type NodeProps, type Node, type Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useParserStore } from "../store";

const COLORS: Record<string, string> = {
    loot_table: "#f59e0b",
    recipe: "#10b981",
    advancement: "#6366f1",
    predicate: "#ec4899",
    item_modifier: "#8b5cf6",
    dimension: "#06b6d4",
    dimension_type: "#14b8a6",
    worldgen: "#84cc16",
    tag: "#ef4444",
    default: "#64748b",
};

interface FileNodeData extends Record<string, unknown> {
    id: string;
    registry: string;
    isSelected: boolean;
    hasRefs: boolean;
}

function FileNode({ data }: NodeProps<Node<FileNodeData>>) {
    const color = COLORS[data.registry] ?? COLORS.default;

    return (
        <div style={{
            background: "#1a1a1a",
            borderRadius: 8,
            overflow: "hidden",
            border: data.isSelected ? "2px solid #fff" : "1px solid rgba(255,255,255,0.1)",
            opacity: data.hasRefs ? 1 : 0.5,
            minWidth: 180,
        }}>
            <Handle type="target" position={Position.Top} style={{ background: color }} />
            <div style={{
                padding: "4px 10px",
                background: color,
                fontSize: 10,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                color: "#fff",
            }}>
                {data.registry}
            </div>
            <div style={{
                padding: "8px 10px",
                fontSize: 12,
                color: "#fff",
                wordBreak: "break-word",
            }}>
                {data.id}
            </div>
            <Handle type="source" position={Position.Bottom} style={{ background: color }} />
        </div>
    );
}

const nodeTypes = { file: FileNode };

function getRegistryFromId(id: string, files: Record<string, Uint8Array>): string {
    for (const path of Object.keys(files)) {
        if (!path.startsWith("data/")) continue;
        const match = path.match(/^data\/([^/]+)\/([^/]+)\/(.+)\.json$/);
        if (!match) continue;
        const [, namespace, registry, resource] = match;
        if (`${namespace}:${resource}` === id) return registry;
    }
    return "default";
}

export default function Graph() {
    const graph = useParserStore((s) => s.graph);
    const files = useParserStore((s) => s.files);
    const selectedNode = useParserStore((s) => s.selectedNode);
    const setSelectedNode = useParserStore((s) => s.setSelectedNode);

    if (!graph) return null;

    const nodeArray = Array.from(graph.entries());
    const cols = Math.ceil(Math.sqrt(nodeArray.length));

    const nodes: Node<FileNodeData>[] = nodeArray.map(([id, node], i) => {
        const registry = getRegistryFromId(id, files);
        return {
            id,
            type: "file",
            position: { x: (i % cols) * 240, y: Math.floor(i / cols) * 120 },
            data: {
                id,
                registry,
                isSelected: id === selectedNode,
                hasRefs: node.refs.size > 0 || node.referencedBy.size > 0,
            },
        };
    });

    const edges: Edge[] = [];
    for (const [id, node] of graph) {
        for (const refId of node.refs) {
            if (graph.has(refId)) {
                edges.push({
                    id: `${id}->${refId}`,
                    source: id,
                    target: refId,
                    animated: true,
                    style: { stroke: "#555", strokeWidth: 2 },
                });
            }
        }
    }

    return (
        <div style={{ width: "100%", height: "100%" }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodeClick={(_, node) => setSelectedNode(node.id)}
                fitView
                minZoom={0.1}
                maxZoom={2}
            >
                <Background color="#333" gap={20} />
                <Controls />
            </ReactFlow>
        </div>
    );
}
