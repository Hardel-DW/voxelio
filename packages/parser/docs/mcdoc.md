# MCDoc API Types Reference

Complete TypeScript typing for Spyglass MCDoc APIs.
## API Endpoints
- `https://api.spyglassmc.com/vanilla-mcdoc/symbols` - All mcdoc schemas (all versions merged)
- `https://api.spyglassmc.com/mcje/versions` - MC versions with pack_format mapping

// Example of resolved mcdoc type
{kind: 'string',attributes: [{ name: 'id', value: { kind: 'literal', value: { value: 'loot_table' } } }]}

● API Reference

/mcje/versions - MC version. An Array of objects. Example:
id	"26.1-snapshot-1"
name	"26.1 Snapshot 1"
release_target	null
type	"snapshot"
stable	false
data_version	4764
protocol_version	1073742111
data_pack_version	95
data_pack_version_minor	0
resource_pack_version	76
resource_pack_version_minor	0
build_time	"2025-12-16T12:41:11+00:00"
release_time	"2025-12-16T12:42:29+00:00"
sha1	"b9345ee364d36ef1c7ec26df6bf99d3e4a4393f5"

/vanilla-mcdoc/symbols - Resolved mcdoc schemas all version in one file. Example with until/since filter. Example
Types contains three properties:
- ref: string
- mcdoc: Record<string, McdocType> // "::java::data::loot::LootTable" → type
-'mcdoc/dispatcher': Record<string, Record<string, McdocType>> // "minecraft:loot_function" → { "set_count": type, "set_name": type, ... }

{ kind: "pair", key: "random_sequence", attributes: [{ name: "since", value: "1.20" }], type: { kind: "string", ... }}

---

## /vanilla-mcdoc/symbols Response
```typescript
interface VanillaMcdocSymbols {
  ref: string; // hash/version identifier
  mcdoc: Record<string, McdocType>; // "::java::data::loot::LootTable" → type
  "mcdoc/dispatcher": Record<string, Record<string, McdocType>>;
  // "minecraft:loot_function" → { "set_count": type, ... }
}
```

---

## McdocType - All Kinds
```typescript
type McdocType =
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
  | AnyType;
```

### struct
```typescript
interface StructType {
  kind: "struct";
  fields: McdocField[];
  desc?: string;
}

type McdocField = PairField | SpreadField;

interface PairField {
  kind: "pair";
  key: string | McdocType; // string for named, McdocType for dynamic keys [string]: ...
  type: McdocType;
  optional?: boolean;
  desc?: string;
  attributes?: Attribute[];
}

interface SpreadField {
  kind: "spread";
  type: ReferenceType | ConcreteType | DispatcherType;
  attributes?: Attribute[];
}
```

### enum
```typescript
interface EnumType {
  kind: "enum";
  enumKind: "string" | "int";
  values: EnumValue[];
  desc?: string;
}

interface EnumValue {
  identifier: string;
  value: string | number;
  desc?: string;
  attributes?: Attribute[];
}
```

### list
```typescript
interface ListType {
  kind: "list";
  item: McdocType;
  lengthRange?: NumericRange;
}

interface NumericRange {
  kind: 0; // inclusive
  min?: number;
  max?: number;
}
```

### union
```typescript
interface UnionType {
  kind: "union";
  members: McdocType[];
}
```

### reference
```typescript
interface ReferenceType {
  kind: "reference";
  path: string; // "::java::data::loot::LootTable"
  attributes?: Attribute[];
}
```

### dispatcher
```typescript
interface DispatcherType {
  kind: "dispatcher";
  registry: string; // "minecraft:loot_function"
  parallelIndices: ParallelIndex[];
}

type ParallelIndex = DynamicIndex | StaticIndex;

interface DynamicIndex {
  kind: "dynamic";
  accessor: (string | { keyword: "key" | "parent" })[];
  // ["type"] = [[type]], [{ keyword: "key" }] = [[%key]]
}

interface StaticIndex {
  kind: "static";
  value: string; // specific key or "%fallback"
}
```

### template
```typescript
interface TemplateType {
  kind: "template";
  child: McdocType;
  typeParams: { path: string }[];
}
```

### concrete
```typescript
interface ConcreteType {
  kind: "concrete";
  child: ReferenceType;
  typeArgs: McdocType[];
}
```

### literal
```typescript
interface LiteralType {
  kind: "literal";
  value: {
    kind: "string" | "int" | "boolean";
    value: string | number | boolean;
  };
}
```

### string
```typescript
interface StringType {
  kind: "string";
  lengthRange?: NumericRange;
  attributes?: Attribute[];
}
```

### Numeric types (byte, short, int, long, float, double)
```typescript
interface NumericType {
  kind: "byte" | "short" | "int" | "long" | "float" | "double";
  valueRange?: NumericRange;
}
```

### boolean
```typescript
interface BooleanType {
  kind: "boolean";
}
```

### any
```typescript
interface AnyType {
  kind: "any";
}
```

---

## Attributes

```typescript
interface Attribute {
  name: string;
  value?: AttributeValue;
}

type AttributeValue = LiteralAttributeValue | TreeAttributeValue;

interface LiteralAttributeValue {
  kind: "literal";
  value: {
    kind: "string" | "int" | "boolean";
    value: string | number | boolean;
  };
}

interface TreeAttributeValue {
  kind: "tree";
  values: Record<string, AttributeValue>;
}
```

### Common Attributes

| Name | Value Type | Description |
|------|------------|-------------|
| `id` | literal string or tree | References a registry |
| `since` | literal string | Available from this version |
| `until` | literal string | Available until this version |
| `color` | literal string | Color format (composite_argb, dec_rgb, hex_rgb) |
| `nbt` | tree | NBT type reference |
| `canonical` | none | Requires canonical form |
| `regex_pattern` | none | Value is a regex |
| `integer` | none/tree | String must be integer |

### #[id] Attribute Variants

```typescript
// Simple: #[id="item"]
{ name: "id", value: { kind: "literal", value: { kind: "string", value: "item" } } }

// Complex: #[id(registry="item", tags="allowed", exclude=["air"])]
{
  name: "id",
  value: {
    kind: "tree",
    values: {
      registry: { kind: "literal", value: { kind: "string", value: "item" } },
      tags: { kind: "literal", value: { kind: "string", value: "allowed" } },
      exclude: { kind: "list", values: [...] },
      definition: { kind: "literal", value: { kind: "boolean", value: true } },
      path: { kind: "literal", value: { kind: "string", value: "textures" } }
    }
  }
}
```

---

## /mcje/versions Response

```typescript
type McjeVersionsResponse = McjeVersion[];

interface McjeVersion {
  id: string;                      // "1.21.4", "26.1-snapshot-1"
  name: string;                    // "1.21.4", "26.1 Snapshot 1"
  release_target: string | null;   // "1.21.4" for snapshots
  type: "release" | "snapshot";
  stable: boolean;
  data_version: number;
  protocol_version: number;
  data_pack_version: number;       // pack_format for datapacks
  data_pack_version_minor: number;
  resource_pack_version: number;   // pack_format for resourcepacks
  resource_pack_version_minor: number;
  build_time: string;              // ISO date
  release_time: string;            // ISO date
  sha1: string;
}
```