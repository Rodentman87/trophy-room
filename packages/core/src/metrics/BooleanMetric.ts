import { BaseMetric } from "./BaseMetric";

export class BooleanMetric<ID extends string> extends BaseMetric<ID, boolean> {
	override serializeValue(value: boolean): string {
		return value.toString();
	}

	override deserializeValue(value: string): boolean {
		return value === "true";
	}

	is(value: boolean, target: boolean) {
		return value === target;
	}

	isNot(value: boolean, target: boolean) {
		return value !== target;
	}
}
