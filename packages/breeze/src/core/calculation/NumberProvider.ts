export type NumberProviderObject = number | NumberProviderTypeObject;

export interface NumberProviderTypeObject {
	type: string;
}

export interface NumberProviderObjectConstant extends NumberProviderTypeObject {
	type: "minecraft:constant";
	value: number;
}

export interface NumberProviderObjectUniform extends NumberProviderTypeObject {
	type: "minecraft:uniform";
	min: NumberProvider;
	max: NumberProvider;
}

export interface NumberProviderObjectBinomial extends NumberProviderTypeObject {
	type: "minecraft:binomial";
	n: NumberProvider;
	p: NumberProvider;
}

export class NumberProvider {
	private value: NumberProviderObject;
	constructor(value: any) {
		if (this.isValidNumberProvider(value)) {
			this.value = value;
		} else {
			throw new Error("Invalid number provider");
		}
	}

	private isValidNumberProvider(value: any): value is NumberProviderObject {
		return typeof value === "number" || (typeof value === "object" && value !== null && "type" in value);
	}

	public getRollDescription(): string {
		const range = NumberProvider.tryEvaluateRange(this.value);
		if (range) {
			return range.min === range.max ? `${range.min} Roll` : `${range.min}-${range.max} Roll`;
		}
		return "Roll indeterminable";
	}

	private static tryEvaluateRange(provider: NumberProvider | NumberProviderObject): { min: number; max: number } | null {
		if (provider instanceof NumberProvider) return NumberProvider.tryEvaluateRange(provider.value);
		if (typeof provider === "number") return { min: provider, max: provider };

		if (NumberProvider.isConstant(provider)) return NumberProvider.tryEvaluateConstant(provider);
		if (NumberProvider.isUniform(provider)) return NumberProvider.tryEvaluateUniform(provider);
		if (NumberProvider.isBinomial(provider)) return NumberProvider.tryEvaluateBinomial(provider);
		return null;
	}

	private static tryEvaluateConstant(provider: NumberProviderObjectConstant): { min: number; max: number } {
		return { min: provider.value, max: provider.value };
	}

	private static tryEvaluateUniform(provider: NumberProviderObjectUniform): { min: number; max: number } | null {
		const minRange = NumberProvider.tryEvaluateRange(provider.min);
		const maxRange = NumberProvider.tryEvaluateRange(provider.max);
		if (minRange && maxRange && minRange.min === minRange.max && maxRange.min === maxRange.max)
			return { min: minRange.min, max: maxRange.min };
		return null;
	}

	private static tryEvaluateBinomial(provider: NumberProviderObjectBinomial): { min: number; max: number } | null {
		const nRange = NumberProvider.tryEvaluateRange(provider.n);
		if (nRange && nRange.min === nRange.max) return { min: 0, max: nRange.min };
		return null;
	}

	private static isConstant(provider: NumberProviderTypeObject): provider is NumberProviderObjectConstant {
		return provider.type === "minecraft:constant";
	}

	private static isUniform(provider: NumberProviderTypeObject): provider is NumberProviderObjectUniform {
		return provider.type === "minecraft:uniform";
	}

	private static isBinomial(provider: NumberProviderTypeObject): provider is NumberProviderObjectBinomial {
		return provider.type === "minecraft:binomial";
	}
}
