import type { DataInput } from "@/io/DataInput";
import type { DataOutput } from "@/io/DataOutput";
import type { JsonValue } from "@/util/Json";
import { Json } from "@/util/Json";
import { NbtTag } from "@/tags/NbtTag";
import { NbtType } from "@/tags/NbtType";

export class NbtFloat extends NbtTag {
	private readonly value: number;

	constructor(value: number) {
		super();
		this.value = value;
	}

	public override getId() {
		return NbtType.Float;
	}

	public override equals(other: NbtTag): boolean {
		return other.isFloat() && this.value === other.value;
	}

	public override getAsNumber() {
		return this.value;
	}

	public override toString() {
		return `${this.value.toString()}f`;
	}

	public override toPrettyString() {
		return this.toString();
	}

	public override toSimplifiedJson() {
		return this.value;
	}

	public override toJson() {
		return this.value;
	}

	public override toBytes(output: DataOutput) {
		output.writeFloat(this.value);
	}

	public static create() {
		return new NbtFloat(0);
	}

	public static fromJson(value: JsonValue) {
		return new NbtFloat(Json.readNumber(value) ?? 0);
	}

	public static fromBytes(input: DataInput) {
		const value = input.readFloat();
		return new NbtFloat(value);
	}
}

NbtTag.register(NbtType.Float, NbtFloat);
