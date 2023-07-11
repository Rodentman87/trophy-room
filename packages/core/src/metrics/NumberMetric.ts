import { BaseMetric } from "./BaseMetric";

export class NumberMetric<ID extends string> extends BaseMetric<ID, number> {
	override serializeValue(value: number): string {
		return value.toString();
	}

	override deserializeValue(value: string): number {
		return parseFloat(value);
	}

	greaterThan(value: number, target: number) {
		return value > target;
	}

	lessThan(value: number, target: number) {
		return value < target;
	}

	equalTo(value: number, target: number) {
		return value === target;
	}

	greaterThanOrEqualTo(value: number, target: number) {
		return value >= target;
	}

	lessThanOrEqualTo(value: number, target: number) {
		return value <= target;
	}
}
