export type FileStatus = "added" | "modified" | "deleted";

export class UIntDiff {
	private changes: Map<string, FileStatus>;

	constructor(original: Record<string, Uint8Array>, modified: Record<string, Uint8Array>) {
		this.changes = new Map();
		const allPaths = new Set([...Object.keys(original), ...Object.keys(modified)]);

		for (const path of allPaths) {
			const originalFile = original[path];
			const modifiedFile = modified[path];

			if (!originalFile && modifiedFile) {
				this.changes.set(path, "added");
			} else if (originalFile && !modifiedFile) {
				this.changes.set(path, "deleted");
			} else if (originalFile && modifiedFile) {
				if (!this.areEqual(originalFile, modifiedFile)) {
					this.changes.set(path, "modified");
				}
			}
		}
	}

	getPaths(): string[] {
		return [...this.changes.keys()];
	}

	getChanges(): Map<string, FileStatus> {
		return this.changes;
	}

	private areEqual(a: Uint8Array, b: Uint8Array): boolean {
		if (a.length !== b.length) return false;
		return a.every((val, i) => val === b[i]);
	}
}
