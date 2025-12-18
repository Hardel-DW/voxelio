import { useParserStore } from "../store";

export default function NodeDetails() {
    const graph = useParserStore((s) => s.graph);
    const selectedNode = useParserStore((s) => s.selectedNode);
    const setSelectedNode = useParserStore((s) => s.setSelectedNode);

    if (!selectedNode || !graph) return null;

    const node = graph.get(selectedNode);
    if (!node) return null;

    return (
        <div style={{
            position: "absolute",
            top: 16,
            right: 16,
            width: 320,
            maxHeight: "calc(100vh - 32px)",
            overflow: "auto",
            padding: 20,
            background: "rgba(20, 20, 20, 0.6)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderRadius: 12,
            border: "1px solid rgba(255, 255, 255, 0.1)",
            fontFamily: "system-ui",
        }}>
            <h3 style={{ margin: "0 0 16px", color: "#fff", fontSize: 15, wordBreak: "break-all" }}>
                {selectedNode}
            </h3>

            {node.refs.size > 0 && (
                <div style={{ marginBottom: 16 }}>
                    <h4 style={{ margin: "0 0 8px", color: "#888", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>
                        References ({node.refs.size})
                    </h4>
                    <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                        {Array.from(node.refs).map((ref) => (
                            <li key={ref}>
                                <button
                                    type="button"
                                    onClick={() => graph.has(ref) && setSelectedNode(ref)}
                                    disabled={!graph.has(ref)}
                                    style={{
                                        display: "block",
                                        width: "100%",
                                        padding: "6px 10px",
                                        background: "rgba(255, 255, 255, 0.05)",
                                        color: graph.has(ref) ? "#4f9" : "#555",
                                        cursor: graph.has(ref) ? "pointer" : "default",
                                        fontSize: 12,
                                        border: "none",
                                        borderRadius: 4,
                                        textAlign: "left",
                                        marginBottom: 4,
                                    }}
                                >
                                    → {ref}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {node.referencedBy.size > 0 && (
                <div>
                    <h4 style={{ margin: "0 0 8px", color: "#888", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>
                        Referenced by ({node.referencedBy.size})
                    </h4>
                    <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                        {Array.from(node.referencedBy).map((ref) => (
                            <li key={ref}>
                                <button
                                    type="button"
                                    onClick={() => setSelectedNode(ref)}
                                    style={{
                                        display: "block",
                                        width: "100%",
                                        padding: "6px 10px",
                                        background: "rgba(255, 255, 255, 0.05)",
                                        color: "#f9a",
                                        cursor: "pointer",
                                        fontSize: 12,
                                        border: "none",
                                        borderRadius: 4,
                                        textAlign: "left",
                                        marginBottom: 4,
                                    }}
                                >
                                    ← {ref}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
