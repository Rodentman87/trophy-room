import { BooleanMetric } from "./BooleanMetric";
import { MetricsStore } from "./MetricsStore";
import { NumberMetric } from "./NumberMetric";

describe("MetricsStore", () => {
	const num = new NumberMetric("number");
	const bool = new BooleanMetric("boolean");
	const store = new MetricsStore([num, bool]);

	it("should return our metrics by id", () => {
		expect(store.getMetric("number")).toBe(num);
		expect(store.getMetric("boolean")).toBe(bool);
	});

	it("should return metric requiremenets", () => {
		expect(store.require.number.greaterThan(5)).toEqual({
			type: "comparison",
			metric: "number",
			comparisonType: "greaterThan",
			value: 5,
		});
		expect(store.require.boolean.is(true)).toEqual({
			type: "comparison",
			metric: "boolean",
			comparisonType: "is",
			value: true,
		});
		expect(
			store.and(
				store.require.number.greaterThan(5),
				store.require.boolean.is(true)
			)
		).toEqual({
			type: "and",
			metrics: [
				{
					type: "comparison",
					metric: "number",
					comparisonType: "greaterThan",
					value: 5,
				},
				{
					type: "comparison",
					metric: "boolean",
					comparisonType: "is",
					value: true,
				},
			],
		});
		expect(
			store.or(
				store.require.number.greaterThan(5),
				store.require.boolean.is(true)
			)
		).toEqual({
			type: "or",
			metrics: [
				{
					type: "comparison",
					metric: "number",
					comparisonType: "greaterThan",
					value: 5,
				},
				{
					type: "comparison",
					metric: "boolean",
					comparisonType: "is",
					value: true,
				},
			],
		});
		expect(store.not(store.require.number.greaterThan(5))).toEqual({
			type: "not",
			metric: {
				type: "comparison",
				metric: "number",
				comparisonType: "greaterThan",
				value: 5,
			},
		});
		expect(store.never()).toEqual({
			type: "never",
		});
	});
});
