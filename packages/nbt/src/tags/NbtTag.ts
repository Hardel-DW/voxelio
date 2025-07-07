import type { DataInput } from "@/io/DataInput";
import type { DataOutput } from "@/io/DataOutput";
import type { JsonValue } from "@/util/Json";
import { Json } from "@/util/Json";
import { StringReader } from "@/util/StringReader";
import type { NbtByte } from "@/tags/NbtByte";
import type { NbtByteArray } from "@/tags/NbtByteArray";
import type { NbtCompound } from "@/tags/NbtCompound";
import type { NbtDouble } from "@/tags/NbtDouble";
import type { NbtEnd } from "@/tags/NbtEnd";
import type { NbtFloat } from "@/tags/NbtFloat";
import type { NbtInt } from "@/tags/NbtInt";
import type { NbtIntArray } from "@/tags/NbtIntArray";
import type { NbtList } from "@/tags/NbtList";
import type { NbtLong } from "@/tags/NbtLong";
import type { NbtLongArray } from "@/tags/NbtLongArray";
import type { NbtShort } from "@/tags/NbtShort";
import type { NbtString } from "@/tags/NbtString";
import { NbtType } from "@/tags/NbtType";

interface NbtFactory {
	create(): NbtTag;
	fromString(reader: StringReader): NbtTag;
	fromJson(value: JsonValue): NbtTag;
	fromBytes(input: DataInput): NbtTag;
}

export abstract class NbtTag {
	private static readonly FACTORIES = new Map<NbtType, NbtFactory>();

	public static register(type: NbtType, factory: NbtFactory) {
		const factoryType = factory.create().getId();
		if (factoryType !== type) {
			throw new Error(`Registered factory ${NbtType[factoryType]} does not match type ${NbtType[type]}`);
		}
		NbtTag.FACTORIES.set(type, factory);
	}

	public isEnd(): this is NbtEnd {
		return this.getId() === NbtType.End;
	}

	public isByte(): this is NbtByte {
		return this.getId() === NbtType.Byte;
	}

	public isShort(): this is NbtShort {
		return this.getId() === NbtType.Short;
	}

	public isInt(): this is NbtInt {
		return this.getId() === NbtType.Int;
	}

	public isLong(): this is NbtLong {
		return this.getId() === NbtType.Long;
	}

	public isFloat(): this is NbtFloat {
		return this.getId() === NbtType.Float;
	}

	public isDouble(): this is NbtDouble {
		return this.getId() === NbtType.Double;
	}

	public isByteArray(): this is NbtByteArray {
		return this.getId() === NbtType.ByteArray;
	}

	public isString(): this is NbtString {
		return this.getId() === NbtType.String;
	}

	public isList(): this is NbtList {
		return this.getId() === NbtType.List;
	}

	public isCompound(): this is NbtCompound {
		return this.getId() === NbtType.Compound;
	}

	public isIntArray(): this is NbtIntArray {
		return this.getId() === NbtType.IntArray;
	}

	public isLongArray(): this is NbtLongArray {
		return this.getId() === NbtType.LongArray;
	}

	public isNumber(): this is NbtByte | NbtShort | NbtInt | NbtLong | NbtFloat | NbtDouble {
		return this.isByte() || this.isShort() || this.isInt() || this.isLong() || this.isFloat() || this.isDouble();
	}

	public isArray(): this is NbtByteArray | NbtIntArray | NbtLongArray {
		return this.isByteArray() || this.isIntArray() || this.isLongArray();
	}

	public isListOrArray(): this is NbtList | NbtByteArray | NbtIntArray | NbtLongArray {
		return this.isList() || this.isArray();
	}

	public getAsNumber() {
		return 0;
	}

	public getAsString() {
		return "";
	}

	public toJsonWithId(): JsonValue {
		return {
			type: this.getId(),
			value: this.toJson()
		};
	}

	public abstract getId(): NbtType;

	public abstract equals(other: NbtTag): boolean;

	public abstract toString(): string;

	public abstract toPrettyString(indent?: string, depth?: number): string;

	public abstract toJson(): JsonValue;

	public abstract toSimplifiedJson(): JsonValue;

	public abstract toBytes(output: DataOutput): void;

	private static getFactory(id: NbtType) {
		const factory = NbtTag.FACTORIES.get(id);
		if (!factory) {
			throw new Error(`Invalid tag id ${id}`);
		}
		return factory;
	}

	public static create(id: NbtType) {
		return NbtTag.getFactory(id).create();
	}

	public static fromString(input: string | StringReader) {
		const reader = typeof input === "string" ? new StringReader(input) : input;
		return NbtTag.getFactory(NbtType.Compound).fromString(reader);
	}

	public static fromJson(value: JsonValue, id: NbtType = NbtType.Compound) {
		return NbtTag.getFactory(id).fromJson(value);
	}

	public static fromJsonWithId(value: JsonValue) {
		const obj = Json.readObject(value) ?? {};
		const id = Json.readInt(obj.type) ?? 0;
		return NbtTag.fromJson(obj.value ?? {}, id);
	}

	public static fromBytes(input: DataInput, id: NbtType = NbtType.Compound) {
		return NbtTag.getFactory(id).fromBytes(input);
	}
}
