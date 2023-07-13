import { BaseMetric } from "./BaseMetric";

export class BooleanMetric<ID extends string> extends BaseMetric<
	ID,
	boolean,
	boolean
> {
	is(value: boolean, target: boolean) {
		return value === target;
	}

	isNot(value: boolean, target: boolean) {
		return value !== target;
	}
}
