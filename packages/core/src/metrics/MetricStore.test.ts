import { BooleanMetric } from "./BooleanMetric";
import { MetricsStore } from "./MetricsStore";
import { NumberMetric } from "./NumberMetric";

describe("MetricsStore", () => {
	const num = new NumberMetric("number", 0);
	const bool = new BooleanMetric("boolean", false);
	const store = new MetricsStore([num, bool], {
		save: () => {},
		load: () => "{}",
	});

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

	it("should store metric values", () => {
		expect(store.getMetricValue("number")).toBe(0);
		expect(store.getMetricValue("boolean")).toBe(false);
		store.setMetricValue("number", 5);
		store.setMetricValue("boolean", true);
		expect(store.getMetricValue("number")).toBe(5);
		expect(store.getMetricValue("boolean")).toBe(true);
	});

	it("should call an updater function when setting a metric", () => {
		store.setMetricValue("number", 5);
		expect(store.getMetricValue("number")).toBe(5);
		store.setMetricValue("number", (value) => value + 1);
		expect(store.getMetricValue("number")).toBe(6);
	});

	it("should save metric values", () => {
		const saveFunction = jest.fn();
		const savingStore = new MetricsStore([num, bool], {
			save: saveFunction,
			load: () => "{}",
		});
		savingStore.setMetricValue("number", 5);
		expect(saveFunction).toBeCalledTimes(1);
		expect(saveFunction).toBeCalledWith('{"number":5,"boolean":false}');
	});

	it("should load metric values", async () => {
		const loadFunction = jest.fn(() => '{"number":5,"boolean":true}');
		const loadingStore = new MetricsStore([num, bool], {
			save: () => {},
			load: loadFunction,
		});
		await loadingStore.loadMetrics();
		expect(loadingStore.getMetricValue("number")).toBe(5);
		expect(loadingStore.getMetricValue("boolean")).toBe(true);
		expect(loadFunction).toBeCalledTimes(1);
	});

	it("should only save once when using updateMultiple", () => {
		const saveFunction = jest.fn();
		const savingStore = new MetricsStore([num, bool], {
			save: saveFunction,
			load: () => "{}",
		});
		savingStore.updateMultiple(() => {
			savingStore.setMetricValue("number", 5);
			savingStore.setMetricValue("boolean", true);
		});
		expect(saveFunction).toBeCalledTimes(1);
		expect(saveFunction).toBeCalledWith('{"number":5,"boolean":true}');
	});

	it("should emit an event when a metric is updated", () => {
		const listener = jest.fn();
		store.on("metricsUpdated", listener);
		store.setMetricValue("number", 5);
		expect(listener).toBeCalledTimes(1);
		expect(listener).toBeCalledWith(["number"]);
	});

	it("should only emit one event when multiple metrics are updated with updateMultiple", () => {
		const listener = jest.fn();
		store.on("metricsUpdated", listener);
		store.updateMultiple(() => {
			store.setMetricValue("number", 5);
			store.setMetricValue("boolean", true);
		});
		expect(listener).toBeCalledTimes(1);
		expect(listener).toBeCalledWith(["number", "boolean"]);
	});
});
