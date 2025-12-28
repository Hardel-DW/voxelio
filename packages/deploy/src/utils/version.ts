export const MINECRAFT_VERSIONS: { version: string; javaVersion: string }[] = [
    { version: "26.1.0", javaVersion: "Java 25" },
    { version: "1.21.11", javaVersion: "Java 17" },
    { version: "1.21.10", javaVersion: "Java 17" },
    { version: "1.21.9", javaVersion: "Java 17" },
    { version: "1.21.8", javaVersion: "Java 17" },
    { version: "1.21.7", javaVersion: "Java 17" },
    { version: "1.21.6", javaVersion: "Java 17" },
    { version: "1.21.5", javaVersion: "Java 17" },
    { version: "1.21.4", javaVersion: "Java 17" },
    { version: "1.21.3", javaVersion: "Java 17" },
    { version: "1.21.2", javaVersion: "Java 17" },
    { version: "1.21.1", javaVersion: "Java 17" },
    { version: "1.21", javaVersion: "Java 17" },
    { version: "1.20.6", javaVersion: "Java 17" },
    { version: "1.20.5", javaVersion: "Java 17" },
    { version: "1.20.4", javaVersion: "Java 17" },
    { version: "1.20.3", javaVersion: "Java 17" },
    { version: "1.20.2", javaVersion: "Java 17" },
    { version: "1.20.1", javaVersion: "Java 17" },
    { version: "1.20", javaVersion: "Java 17" }
];

export function getRequiredJavaVersions(selectedVersions: string[]): string[] {
    const javaVersions = new Set<string>();
    for (const selected of selectedVersions) {
        const versionMap = MINECRAFT_VERSIONS.find((v) => v.version === selected);
        if (versionMap) {
            javaVersions.add(versionMap.javaVersion);
        }
    }
    return Array.from(javaVersions).sort();
}
