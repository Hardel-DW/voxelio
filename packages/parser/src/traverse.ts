/**
 * Core traversal engine for extracting references from JSON using mcdoc schemas.
 * Uses iterative stack-based approach for performance on deep structures.
 */

import type { Attribute, DispatcherType, McdocType, Reference, StructType, VanillaMcdocSymbols } from "@/types";

interface TraverseContext {
	symbols: VanillaMcdocSymbols;
	version: string;
	refs: Reference[];
}

interface StackItem {
	value: unknown;
	schema: McdocType;
	mapKey?: string;
}

export function getReferences(json: unknown, schema: McdocType, symbols: VanillaMcdocSymbols, version: string): Reference[] {
	const ctx: TraverseContext = { symbols, version, refs: [] };
	const stack: StackItem[] = [{ value: json, schema }];

	while (stack.length > 0) {
		const item = stack.pop();
		if (!item || item.value === null || item.value === undefined) continue;
		processNode(item.value, item.schema, ctx, stack, item.mapKey);
	}

	return ctx.refs;
}

function processNode(value: unknown, schema: McdocType, ctx: TraverseContext, stack: StackItem[], mapKey?: string): void {
	switch (schema.kind) {
		case "string":
			processString(value, schema.attributes, ctx);
			break;
		case "struct":
			processStruct(value, schema, ctx, stack);
			break;
		case "list":
			processList(value, schema.item, stack);
			break;
		case "tuple":
			processTuple(value, schema.items, stack);
			break;
		case "union":
			processUnion(value, schema.members, ctx, stack, mapKey);
			break;
		case "reference":
			processReference(value, schema.path, ctx, stack);
			break;
		case "dispatcher":
			processDispatcher(value, schema, ctx, stack, mapKey);
			break;
		case "concrete":
			processReference(value, schema.child.path, ctx, stack);
			break;
	}
}

function processString(value: unknown, attributes: Attribute[] | undefined, ctx: TraverseContext): void {
	if (typeof value !== "string" || !attributes) return;

	const idAttr = attributes.find((a) => a.name === "id");
	if (!idAttr?.value) return;

	const registry = extractRegistry(idAttr);
	if (registry) ctx.refs.push({ registry, value });
}

function extractRegistry(idAttr: Attribute): string | undefined {
	const attrValue = idAttr.value;
	if (!attrValue) return undefined;

	if (attrValue.kind === "literal" && attrValue.value.kind === "string") {
		return `minecraft:${attrValue.value.value}`;
	}

	if (attrValue.kind === "tree") {
		const registryValue = attrValue.values.registry;
		if (registryValue?.kind !== "literal" || registryValue.value.kind !== "string") return undefined;

		const reg = registryValue.value.value as string;
		return reg.includes(":") ? reg : `minecraft:${reg}`;
	}

	return undefined;
}

function processStruct(value: unknown, schema: StructType, ctx: TraverseContext, stack: StackItem[]): void {
	if (typeof value !== "object" || value === null) return;

	const obj = value as Record<string, unknown>;

	for (const field of schema.fields) {
		if (!isFieldValidForVersion(field.attributes, ctx.version)) continue;

		if (field.kind === "spread") {
			processSpread(value, field.type, ctx, stack);
			continue;
		}

		if (typeof field.key === "string") {
			const fieldValue = obj[field.key];
			if (fieldValue !== undefined) stack.push({ value: fieldValue, schema: field.type });
		} else {
			for (const key of Object.keys(obj)) {
				stack.push({ value: obj[key], schema: field.type, mapKey: key });
				if (field.key.kind === "string") {
					processString(key, field.key.attributes, ctx);
				}
			}
		}
	}
}

function processSpread(value: unknown, spreadType: McdocType, ctx: TraverseContext, stack: StackItem[]): void {
	if (spreadType.kind === "dispatcher") {
		processDispatcher(value, spreadType, ctx, stack);
		return;
	}

	const path = spreadType.kind === "reference" ? spreadType.path : spreadType.kind === "concrete" ? spreadType.child.path : undefined;
	if (!path) return;

	const resolved = ctx.symbols.mcdoc[path];
	if (resolved) stack.push({ value, schema: resolved });
}

function processList(value: unknown, itemSchema: McdocType, stack: StackItem[]): void {
	if (!Array.isArray(value)) return;

	for (const item of value) {
		stack.push({ value: item, schema: itemSchema });
	}
}

function processTuple(value: unknown, items: McdocType[], stack: StackItem[]): void {
	if (!Array.isArray(value)) return;

	const len = Math.min(items.length, value.length);
	for (let i = 0; i < len; i++) {
		stack.push({ value: value[i], schema: items[i] });
	}
}

function processUnion(value: unknown, members: McdocType[], ctx: TraverseContext, stack: StackItem[], mapKey?: string): void {
	const validMembers = members.filter((m) => !("attributes" in m) || isFieldValidForVersion(m.attributes as Attribute[], ctx.version));
	for (const member of validMembers) {
		stack.push({ value, schema: member, mapKey });
	}
}

function processReference(value: unknown, path: string, ctx: TraverseContext, stack: StackItem[]): void {
	const resolved = ctx.symbols.mcdoc[path];
	if (resolved) stack.push({ value, schema: resolved });
}

function processDispatcher(value: unknown, schema: DispatcherType, ctx: TraverseContext, stack: StackItem[], mapKey?: string): void {
	if (typeof value !== "object" || value === null) return;

	const dispatcherMap = ctx.symbols["mcdoc/dispatcher"][schema.registry];
	if (!dispatcherMap) return;

	const rawKey = resolveDispatchKey(value as Record<string, unknown>, schema.parallelIndices, mapKey);
	if (!rawKey) return;

	const key = rawKey.startsWith("minecraft:") ? rawKey.slice(10) : rawKey;
	const dispatchedSchema = dispatcherMap[key] ?? dispatcherMap[rawKey] ?? dispatcherMap["%fallback"];
	if (dispatchedSchema) stack.push({ value, schema: dispatchedSchema });
}

function resolveDispatchKey(obj: Record<string, unknown>, indices: DispatcherType["parallelIndices"], mapKey?: string): string | undefined {
	if (indices.length === 0) return undefined;

	const index = indices[0];
	if (index.kind === "static") return index.value;
	if (index.kind !== "dynamic") return undefined;

	let current: unknown = obj;
	for (const accessor of index.accessor) {
		if (current === null || current === undefined) return undefined;
		if (typeof accessor === "object" && accessor.keyword === "key") {
			return mapKey;
		}
		if (typeof accessor === "string") current = (current as Record<string, unknown>)[accessor];
	}

	return typeof current === "string" ? current : undefined;
}

function isFieldValidForVersion(attributes: Attribute[] | undefined, version: string): boolean {
	if (!attributes) return true;

	for (const attr of attributes) {
		const val = attr.value?.kind === "literal" && attr.value.value.kind === "string" ? (attr.value.value.value as string) : undefined;
		if (!val) continue;

		if (attr.name === "since" && compareVersions(version, val) < 0) return false;
		if (attr.name === "until" && compareVersions(version, val) >= 0) return false;
	}

	return true;
}

function compareVersions(a: string, b: string): number {
	const partsA = a.split(".").map((p) => Number.parseInt(p, 10) || 0);
	const partsB = b.split(".").map((p) => Number.parseInt(p, 10) || 0);
	const maxLen = Math.max(partsA.length, partsB.length);

	for (let i = 0; i < maxLen; i++) {
		const diff = (partsA[i] ?? 0) - (partsB[i] ?? 0);
		if (diff !== 0) return diff;
	}

	return 0;
}
