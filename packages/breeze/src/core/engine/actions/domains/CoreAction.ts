import { deleteValueAtPath, getValueAtPath, setValueAtPath } from "@/core/engine/actions/utils";
import { Action } from "@/core/engine/actions/index";

const ensureArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

type ReturnCore = CoreAction<{ path: string; value: unknown }>;

export class CoreAction<P = any> extends Action<P> {
	constructor(
		params: P,
		private applyFn: (element: Record<string, unknown>, params: P) => Record<string, unknown>
	) {
		super(params);
	}

	apply(element: Record<string, unknown>, _version?: number): Record<string, unknown> {
		return this.applyFn(element, this.params);
	}

	static setValue(path: string, value: unknown): ReturnCore {
		return new CoreAction({ path, value }, (el, p: { path: string; value: unknown }) => setValueAtPath(el, p.path, p.value));
	}

	static toggleValue(path: string, value: unknown): ReturnCore {
		return new CoreAction({ path, value }, (el, p: { path: string; value: unknown }) => {
			const current = getValueAtPath(el, p.path);
			return setValueAtPath(el, p.path, current === p.value ? undefined : p.value);
		});
	}

	static toggleValueInList(path: string, value: unknown): ReturnCore {
		return new CoreAction({ path, value }, (el, p: { path: string; value: unknown }) => {
			const arr = ensureArray<unknown>(getValueAtPath(el, p.path));
			const exists = arr.includes(p.value);
			return setValueAtPath(el, p.path, exists ? arr.filter((i) => i !== p.value) : [...arr, p.value]);
		});
	}

	static toggleAllValuesInList(path: string, values: unknown[]): CoreAction<{ path: string; values: unknown[] }> {
		return new CoreAction({ path, values }, (el, p: { path: string; values: unknown[] }) => {
			const arr = ensureArray<unknown>(getValueAtPath(el, p.path));
			const hasAny = p.values.some((v) => arr.includes(v));
			if (hasAny) {
				return setValueAtPath(
					el,
					p.path,
					arr.filter((i) => !p.values.includes(i))
				);
			}
			const next = [...arr];
			for (const v of p.values) {
				if (!next.includes(v)) next.push(v);
			}
			return setValueAtPath(el, p.path, next);
		});
	}

	static setUndefined(path: string): CoreAction<{ path: string }> {
		return new CoreAction({ path }, (el, p: { path: string }) => deleteValueAtPath(el, p.path));
	}

	static invertBoolean(path: string): CoreAction<{ path: string }> {
		return new CoreAction({ path }, (el, p: { path: string }) => {
			const bool = getValueAtPath(el, p.path);
			return typeof bool === "boolean" ? setValueAtPath(el, p.path, !bool) : el;
		});
	}

	static addTags(tags: string[]): CoreAction<{ tags: string[] }> {
		return new CoreAction({ tags }, (el, p: { tags: string[] }) => {
			const clone = structuredClone(el);
			if (Array.isArray(clone.tags)) {
				clone.tags = [...clone.tags, ...p.tags];
			}
			return clone;
		});
	}

	static removeTags(tags: string[]): CoreAction<{ tags: string[] }> {
		return new CoreAction({ tags }, (el, p: { tags: string[] }) => {
			const clone = structuredClone(el);
			if (Array.isArray(clone.tags)) {
				clone.tags = clone.tags.filter((tag) => !p.tags.includes(tag));
			}
			return clone;
		});
	}
}
