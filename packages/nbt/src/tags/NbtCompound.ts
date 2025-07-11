import type { DataInput } from "@/io/DataInput";
import type { DataOutput } from "@/io/DataOutput";
import { NbtParser } from "@/NbtParser";
import type { JsonValue } from "@/util/Json";
import { Json } from "@/util/Json";
import { StringReader } from "@/util/StringReader";
import type { NbtByte } from "@/tags/NbtByte";
import { NbtByteArray } from "@/tags/NbtByteArray";
import type { NbtDouble } from "@/tags/NbtDouble";
import type { NbtFloat } from "@/tags/NbtFloat";
import type { NbtInt } from "@/tags/NbtInt";
import { NbtIntArray } from "@/tags/NbtIntArray";
import { NbtList } from "@/tags/NbtList";
import type { NbtLong } from "@/tags/NbtLong";
import { NbtLongArray } from "@/tags/NbtLongArray";
import type { NbtShort } from "@/tags/NbtShort";
import type { NbtString } from "@/tags/NbtString";
import { NbtTag } from "@/tags/NbtTag";
import { NbtType } from "@/tags/NbtType";

export class NbtCompound extends NbtTag {
	private readonly properties: Map<string, NbtTag>;

	constructor(properties?: Map<string, NbtTag>) {
		super();
		this.properties = properties ?? new Map();
	}

	public override getId() {
		return NbtType.Compound;
	}

	public override equals(other: NbtTag): boolean {
		if (!other.isCompound()) return false;
		if (this.size !== other.size) return false;
		return [...this.properties.entries()].every(([key, value]) => {
			const otherValue = other.properties.get(key);
			return otherValue !== undefined && value.equals(otherValue);
		});
	}

	public has(key: string) {
		return this.properties.has(key);
	}

	public hasNumber(key: string) {
		return this.get(key)?.isNumber() ?? false;
	}

	public hasString(key: string) {
		return this.get(key)?.isString() ?? false;
	}

	public hasList(key: string, type?: number, length?: number) {
		const tag = this.get(key);
		return (
			(tag?.isList() && (type === undefined || tag.getType() === type) && (length === undefined || tag.length === length)) ?? false
		);
	}

	public hasCompound(key: string) {
		return this.get(key)?.isCompound() ?? false;
	}

	public get(key: string) {
		return this.properties.get(key);
	}

	public getString(key: string) {
		return this.get(key)?.getAsString() ?? "";
	}

	public getNumber(key: string) {
		return this.get(key)?.getAsNumber() ?? 0;
	}

	public getBoolean(key: string) {
		return this.getNumber(key) !== 0;
	}

	public getList(key: string) {
		const tag = this.get(key);
		if (tag?.isList()) {
			return tag;
		}
		return NbtList.create();
	}

	private getTypedList<T extends NbtTag>(key: string, type: number): NbtList<T> {
		const tag = this.get(key);
		if (tag?.isList() && tag.getType() === type) {
			return tag as NbtList<T>;
		}
		return NbtList.create() as NbtList<T>;
	}

	public getByteList(key: string): NbtList<NbtByte> {
		return this.getTypedList<NbtByte>(key, 1);
	}

	public getShortList(key: string): NbtList<NbtShort> {
		return this.getTypedList<NbtShort>(key, 2);
	}

	public getIntList(key: string): NbtList<NbtInt> {
		return this.getTypedList<NbtInt>(key, 3);
	}

	public getLongList(key: string): NbtList<NbtLong> {
		return this.getTypedList<NbtLong>(key, 4);
	}

	public getFloatList(key: string): NbtList<NbtFloat> {
		return this.getTypedList<NbtFloat>(key, 5);
	}

	public getDoubleList(key: string): NbtList<NbtDouble> {
		return this.getTypedList<NbtDouble>(key, 6);
	}

	public getByteArrayList(key: string): NbtList<NbtByteArray> {
		return this.getTypedList<NbtByteArray>(key, 7);
	}

	public getStringList(key: string): NbtList<NbtString> {
		return this.getTypedList<NbtString>(key, 8);
	}

	public getListList(key: string): NbtList<NbtList> {
		return this.getTypedList<NbtList>(key, 9);
	}

	public getCompoundList(key: string): NbtList<NbtCompound> {
		return this.getTypedList<NbtCompound>(key, 10);
	}

	public getIntArrayList(key: string): NbtList<NbtIntArray> {
		return this.getTypedList<NbtIntArray>(key, 11);
	}

	public getLongArrayList(key: string): NbtList<NbtLongArray> {
		return this.getTypedList<NbtLongArray>(key, 12);
	}

	public getCompound(key: string) {
		const tag = this.get(key);
		if (tag?.isCompound()) {
			return tag;
		}
		return NbtCompound.create();
	}

	public getByteArray(key: string) {
		const tag = this.get(key);
		if (tag?.isByteArray()) {
			return tag;
		}
		return NbtByteArray.create();
	}

	public getIntArray(key: string) {
		const tag = this.get(key);
		if (tag?.isIntArray()) {
			return tag;
		}
		return NbtIntArray.create();
	}

	public getLongArray(key: string) {
		const tag = this.get(key);
		if (tag?.isLongArray()) {
			return tag;
		}
		return NbtLongArray.create();
	}

	public keys() {
		return this.properties.keys();
	}

	public get size() {
		return this.properties.size;
	}

	public map<U>(fn: (key: string, value: NbtTag, compound: this) => [string, U]): Record<string, U> {
		return Object.fromEntries([...this.properties.entries()].map(([key, value]) => fn(key, value, this)));
	}

	public forEach(fn: (key: string, value: NbtTag, compound: this) => void) {
		[...this.properties.entries()].forEach(([key, value]) => fn(key, value, this));
	}

	public set(key: string, value: NbtTag) {
		this.properties.set(key, value);
		return this;
	}

	public delete(key: string) {
		return this.properties.delete(key);
	}

	public clear() {
		this.properties.clear();
		return this;
	}

	public override toString(): string {
		const pairs: string[] = [];
		for (const [key, tag] of this.properties.entries()) {
			const needsQuotes = key.split("").some((c) => !StringReader.isAllowedInUnquotedString(c));
			pairs.push(`${needsQuotes ? JSON.stringify(key) : key}:${tag.toString()}`);
		}
		return `{${pairs.join(",")}}`;
	}

	public override toPrettyString(indent = "  ", depth = 0) {
		if (this.size === 0) return "{}";
		const i = indent.repeat(depth);
		const ii = indent.repeat(depth + 1);
		const pairs: string[] = [];
		for (const [key, tag] of this.properties.entries()) {
			const needsQuotes = key.split("").some((c) => !StringReader.isAllowedInUnquotedString(c));
			pairs.push(`${needsQuotes ? JSON.stringify(key) : key}: ${tag.toPrettyString(indent, depth + 1)}`);
		}
		return `{\n${pairs.map((p) => ii + p).join(",\n")}\n${i}}`;
	}

	public override toSimplifiedJson() {
		return this.map((key, value) => [key, value.toSimplifiedJson()]);
	}

	public override toJson() {
		return this.map((key, value) => [
			key,
			{
				type: value.getId(),
				value: value.toJson()
			}
		]);
	}

	public override toBytes(output: DataOutput) {
		for (const [key, tag] of this.properties.entries()) {
			const id = tag.getId();
			output.writeByte(id);
			output.writeString(key);
			tag.toBytes(output);
		}
		output.writeByte(NbtType.End);
	}

	public static create() {
		return new NbtCompound();
	}

	public static fromString(reader: StringReader): NbtTag {
		return NbtParser.readTag(reader);
	}

	public static fromJson(value: JsonValue): NbtCompound {
		const properties = Json.readMap(value, (e) => {
			const { type, value } = Json.readObject(e) ?? {};
			const id = Json.readNumber(type);
			const tag = NbtTag.fromJson(value ?? {}, id);
			return tag;
		});
		return new NbtCompound(new Map(Object.entries(properties)));
	}

	public static fromBytes(input: DataInput) {
		const properties = new Map<string, NbtTag>();
		while (true) {
			const id = input.readByte();
			if (id === NbtType.End) break;
			const key = input.readString();
			const value = NbtTag.fromBytes(input, id);
			properties.set(key, value);
		}
		return new NbtCompound(properties);
	}
}

NbtTag.register(NbtType.Compound, NbtCompound);
