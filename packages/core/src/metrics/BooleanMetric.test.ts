import { BooleanMetric } from "./BooleanMetric";

describe("BooleanMetric", () => {
	const metric = new BooleanMetric("test", false);

	it("should serialize values", () => {
		expect(metric.serializeValue(true)).toBe(true);
		expect(metric.serializeValue(false)).toBe(false);
	});

	it("should deserialize values", () => {
		expect(metric.deserializeValue(true)).toBe(true);
		expect(metric.deserializeValue(false)).toBe(false);
	});

	it("should compare values for is", () => {
		expect(metric.is(true, true)).toBe(true);
		expect(metric.is(true, false)).toBe(false);
		expect(metric.is(false, true)).toBe(false);
		expect(metric.is(false, false)).toBe(true);
	});

	it("should compare values for isNot", () => {
		expect(metric.isNot(true, true)).toBe(false);
		expect(metric.isNot(true, false)).toBe(true);
		expect(metric.isNot(false, true)).toBe(true);
		expect(metric.isNot(false, false)).toBe(false);
	});
});
