import { PackGraph } from "@voxelio/parser";
import { useEffect } from "react";
import Dropzone from "./components/Dropzone";
import Graph from "./components/Graph";
import NodeDetails from "./components/NodeDetails";
import { useSymbols } from "./hooks/useSymbols";
import { useParserStore } from "./store";

export default function App() {
    const { data: symbols, isLoading, error } = useSymbols();
    const files = useParserStore((s) => s.files);
    const graph = useParserStore((s) => s.graph);
    const setGraph = useParserStore((s) => s.setGraph);
    const reset = useParserStore((s) => s.reset);

    const fileCount = Object.keys(files).length;

    useEffect(() => {
        if (!symbols || fileCount === 0) return;
        setGraph(new PackGraph(files, symbols, "1.21.4").generateAll());
    }, [fileCount, files, setGraph, symbols]);

    const hasFiles = fileCount > 0;

    if (!hasFiles) {
        return (
            <div
                style={{
                    width: "100vw",
                    height: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "system-ui",
                    color: "#eee",
                    background: "#0a0a0a",
                    gap: 20
                }}>
                <h1 style={{ margin: 0, fontSize: 28 }}>@voxelio/parser</h1>
                {isLoading && <p style={{ color: "#888" }}>Loading mcdoc symbols...</p>}
                {error && <p style={{ color: "#f66" }}>Error: {error.message}</p>}
                {symbols && <Dropzone />}
            </div>
        );
    }

    return (
        <div style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden" }}>
            <Graph />

            <div
                style={{
                    position: "absolute",
                    top: 16,
                    left: 16,
                    padding: "12px 20px",
                    background: "rgba(20, 20, 20, 0.6)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    borderRadius: 12,
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "#fff",
                    fontFamily: "system-ui",
                    display: "flex",
                    alignItems: "center",
                    gap: 16
                }}>
                <span style={{ fontSize: 14, color: "#aaa" }}>
                    {fileCount} files · {graph?.size ?? 0} nodes
                </span>
                <button
                    type="button"
                    onClick={reset}
                    style={{
                        padding: "6px 14px",
                        background: "rgba(255, 255, 255, 0.1)",
                        color: "#fff",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontSize: 13
                    }}>
                    Reset
                </button>
            </div>

            <NodeDetails />
        </div>
    );
}
