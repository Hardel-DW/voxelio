import type { DataInput } from "@/io/DataInput";
import type { DataOutput } from "@/io/DataOutput";
import type { JsonValue } from "@/util/Json";
import { NbtTag } from "@/tags/NbtTag";
import { NbtType } from "@/tags/NbtType";

export class NbtShort extends NbtTag {
	private readonly value: number;

	constructor(value: number) {
		super();
		this.value = value;
	}

	public override getId() {
		return NbtType.Short;
	}

	public override equals(other: NbtTag): boolean {
		return other.isShort() && this.value === other.value;
	}

	public override getAsNumber() {
		return this.value;
	}

	public override toString() {
		return `${this.value.toFixed()}s`;
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
		output.writeShort(this.value);
	}

	public static create() {
		return new NbtShort(0);
	}

	public static fromJson(value: JsonValue) {
		return new NbtShort(typeof value === "number" ? Math.floor(value) : 0);
	}

	public static fromBytes(input: DataInput) {
		const value = input.readShort();
		return new NbtShort(value);
	}
}

NbtTag.register(NbtType.Short, NbtShort);
