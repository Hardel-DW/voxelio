export interface VanillaMcdocSymbols {
	ref: string;
	mcdoc: Record<string, McdocType>;
	"mcdoc/dispatcher": Record<string, Record<string, McdocType>>;
}

export type McdocType =
	| StructType
	| EnumType
	| ListType
	| UnionType
	| ReferenceType
	| DispatcherType
	| TemplateType
	| ConcreteType
	| LiteralType
	| StringType
	| NumericType
	| BooleanType
	| TupleType
	| AnyType;

export interface StructType {
	kind: "struct";
	fields: McdocField[];
	desc?: string;
}

export interface EnumType {
	kind: "enum";
	enumKind: "string" | "int";
	values: EnumValue[];
	desc?: string;
}

export interface ListType {
	kind: "list";
	item: McdocType;
	lengthRange?: NumericRange;
}

export interface TupleType {
	kind: "tuple";
	items: McdocType[];
}

export interface UnionType {
	kind: "union";
	members: McdocType[];
}

export interface ReferenceType {
	kind: "reference";
	path: string;
	attributes?: Attribute[];
}

export interface DispatcherType {
	kind: "dispatcher";
	registry: string;
	parallelIndices: ParallelIndex[];
}

export interface TemplateType {
	kind: "template";
	child: McdocType;
	typeParams: { path: string }[];
}

export interface ConcreteType {
	kind: "concrete";
	child: ReferenceType;
	typeArgs: McdocType[];
}

export interface LiteralType {
	kind: "literal";
	value: LiteralValue;
}

export interface StringType {
	kind: "string";
	lengthRange?: NumericRange;
	attributes?: Attribute[];
}

export interface NumericType {
	kind: "byte" | "short" | "int" | "long" | "float" | "double";
	valueRange?: NumericRange;
}

export interface BooleanType {
	kind: "boolean";
}

export interface AnyType {
	kind: "any";
}

export type McdocField = PairField | SpreadField;

export interface PairField {
	kind: "pair";
	key: string | McdocType;
	type: McdocType;
	optional?: boolean;
	desc?: string;
	attributes?: Attribute[];
}

export interface SpreadField {
	kind: "spread";
	type: ReferenceType | ConcreteType | DispatcherType;
	attributes?: Attribute[];
}

export interface EnumValue {
	identifier: string;
	value: string | number;
	desc?: string;
	attributes?: Attribute[];
}

export interface NumericRange {
	kind: number;
	min?: number;
	max?: number;
}

export type ParallelIndex = DynamicIndex | StaticIndex;

export interface DynamicIndex {
	kind: "dynamic";
	accessor: (string | { keyword: "key" | "parent" })[];
}

export interface StaticIndex {
	kind: "static";
	value: string;
}

export interface LiteralValue {
	kind: "string" | "int" | "boolean";
	value: string | number | boolean;
}

export interface Attribute {
	name: string;
	value?: AttributeValue;
}

export type AttributeValue = LiteralAttributeValue | TreeAttributeValue;

export interface LiteralAttributeValue {
	kind: "literal";
	value: LiteralValue;
}

export interface TreeAttributeValue {
	kind: "tree";
	values: Record<string, AttributeValue>;
}

export interface Reference {
	registry: string;
	value: string;
}

export interface DependencyNode {
	refs: Set<string>;
	referencedBy: Set<string>;
}

export type DependencyGraph = Map<string, DependencyNode>;
