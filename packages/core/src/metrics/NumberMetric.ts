import { BaseMetric } from "./BaseMetric";

export class NumberMetric<ID extends string> extends BaseMetric<
	ID,
	number,
	number
> {
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
