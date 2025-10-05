import { Identifier, type IdentifierObject } from "@/core/Identifier";
import type { VoxelElement } from "@/core/Element";
import { Differ, type PatchOperation } from "@voxelio/diff";
import type { ChangeSet } from "@/core/engine/migrations/types";

const DECODER = new TextDecoder();
const ENCODER = new TextEncoder();
const CHANGES_PREFIX = "voxel/changeset";

const parseChangePath = (path: string): IdentifierObject | undefined => {
	const parts = path.split("/");
	if (parts.length < 5) return undefined;
	const [, , namespace, ...rest] = parts;
	const resourceWithExt = rest.pop();
	if (!resourceWithExt) return undefined;
	const resource = resourceWithExt.replace(/\.json$/, "");
	const registry = rest.join("/");
	if (!namespace || !registry || !resource) return undefined;
	return { namespace, registry, resource };
};

export class Logger {
	private readonly originals = new Map<string, VoxelElement>();
	private readonly patches = new Map<string, PatchOperation[]>();
	private readonly timestamps = new Map<string, string>();

	constructor(files?: Record<string, Uint8Array>) {
		if (files) {
			this.loadFromFiles(files);
		}
	}

	hasChanges(identifier: IdentifierObject | string): boolean {
		const key = typeof identifier === "string" ? identifier : new Identifier(identifier).toUniqueKey();
		return this.patches.has(key);
	}

	getChangeSets(): ChangeSet[] {
		const changes: ChangeSet[] = [];
		for (const [key, patch] of this.patches.entries()) {
			const identifier = Identifier.fromUniqueKey(key).get();
			changes.push({ identifier, patch, updatedAt: this.timestamps.get(key) });
		}
		return changes;
	}

	listChangedIdentifiers(): IdentifierObject[] {
		return this.getChangeSets().map((change) => change.identifier);
	}

	trackChanges<T extends VoxelElement>(element: T, updater: (draft: T) => Partial<T> | undefined): T {
		const key = new Identifier(element.identifier).toUniqueKey();
		if (!this.originals.has(key)) {
			this.originals.set(key, structuredClone(element));
		}

		const original = this.originals.get(key);
		if (!original) {
			throw new Error(`Original element not registered for ${key}`);
		}

		const draft = structuredClone(element);
		const result = updater(draft);
		const updated = (result ? Object.assign(draft, result) : draft) as T;
		const patch = new Differ(original, updated).diff();

		if (patch.length === 0) {
			this.patches.delete(key);
			this.timestamps.delete(key);
		} else {
			this.patches.set(key, patch);
			this.timestamps.set(key, new Date().toISOString());
		}

		return updated;
	}

	toFileEntries(): Array<{ path: string; content: Uint8Array }> {
		const entries: Array<{ path: string; content: Uint8Array }> = [];
		for (const change of this.getChangeSets()) {
			if (!change.patch.length) continue;
			const identifier = new Identifier(change.identifier);
			const path = identifier.toFilePath(CHANGES_PREFIX);
			entries.push({ path, content: ENCODER.encode(JSON.stringify(change, null, 4)) });
		}
		return entries;
	}

	loadFromFiles(files: Record<string, Uint8Array>) {
		for (const [path, data] of Object.entries(files)) {
			if (!path.startsWith(CHANGES_PREFIX) || !path.endsWith(".json")) continue;

			try {
				const json = JSON.parse(DECODER.decode(data)) as ChangeSet;
				const identifier = json?.identifier ?? parseChangePath(path);
				if (!identifier || !Array.isArray(json?.patch)) continue;
				const key = new Identifier(identifier).toUniqueKey();
				if (json.patch.length === 0) {
					this.patches.delete(key);
					this.timestamps.delete(key);
					continue;
				}
				this.patches.set(key, json.patch);
				if (json.updatedAt) {
					this.timestamps.set(key, json.updatedAt);
				}
			} catch (error) {
				console.warn(`Failed to parse changeset file ${path}:`, error);
			}
		}
	}
}
