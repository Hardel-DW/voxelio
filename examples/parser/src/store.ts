import type { DependencyGraph } from "@voxelio/parser";
import { create } from "zustand";

interface ParserState {
    files: Record<string, Uint8Array>;
    graph: DependencyGraph | null;
    selectedNode: string | null;
    setFiles: (files: Record<string, Uint8Array>) => void;
    setGraph: (graph: DependencyGraph) => void;
    setSelectedNode: (id: string | null) => void;
    reset: () => void;
}

export const useParserStore = create<ParserState>((set) => ({
    files: {},
    graph: null,
    selectedNode: null,
    setFiles: (files) => set({ files }),
    setGraph: (graph) => set({ graph }),
    setSelectedNode: (selectedNode) => set({ selectedNode }),
    reset: () => set({ files: {}, graph: null, selectedNode: null }),
}));
