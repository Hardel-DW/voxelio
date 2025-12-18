import { type DragEvent, type ChangeEvent, useState, useId } from "react";
import { extractZip } from "@voxelio/zip";
import { useParserStore } from "../store";

export default function Dropzone() {
    const [isDragging, setIsDragging] = useState(false);
    const setFiles = useParserStore((s) => s.setFiles);
    const inputId = useId();

    const processFile = async (file: File) => {
        if (!file.name.endsWith(".zip") && !file.name.endsWith(".jar")) {
            alert("Please select a .zip or .jar file");
            return;
        }
        const buffer = await file.arrayBuffer();
        const extracted = await extractZip(new Uint8Array(buffer));
        setFiles(extracted);
    };

    const handleDrop = async (e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
        e.target.value = "";
    };

    return (
        <label
            htmlFor={inputId}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                padding: "48px 64px",
                border: `2px dashed ${isDragging ? "rgba(99, 102, 241, 0.8)" : "rgba(255, 255, 255, 0.15)"}`,
                borderRadius: 16,
                background: isDragging ? "rgba(99, 102, 241, 0.1)" : "rgba(255, 255, 255, 0.02)",
                backdropFilter: "blur(8px)",
                cursor: "pointer",
                transition: "all 0.2s",
            }}
        >
            <div style={{
                width: 64,
                height: 64,
                borderRadius: 12,
                background: "rgba(255, 255, 255, 0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(255, 255, 255, 0.1)",
            }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#888" }}>
                    <title>Upload icon</title>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
            </div>
            <div style={{ textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 16, color: "#fff", fontWeight: 500 }}>
                    Drop your datapack here
                </p>
                <p style={{ margin: "8px 0 0", fontSize: 13, color: "#666" }}>
                    or click to browse (.zip, .jar)
                </p>
            </div>
            <input
                id={inputId}
                type="file"
                accept=".zip,.jar"
                onChange={handleChange}
                style={{ display: "none" }}
            />
        </label>
    );
}
