import { NumberMetric } from "./NumberMetric";

describe("NumberMetric", () => {
	const metric = new NumberMetric("test", 0);

	it("should serialize values", () => {
		expect(metric.serializeValue(5)).toBe(5);
		expect(metric.serializeValue(5.5)).toBe(5.5);
		expect(metric.serializeValue(5.555)).toBe(5.555);
	});

	it("should deserialize values", () => {
		expect(metric.deserializeValue(5)).toBe(5);
		expect(metric.deserializeValue(5.5)).toBe(5.5);
		expect(metric.deserializeValue(5.555)).toBe(5.555);
	});

	it("should compare values for greaterThan", () => {
		expect(metric.greaterThan(5, 4)).toBe(true);
		expect(metric.greaterThan(5, 5)).toBe(false);
		expect(metric.greaterThan(5, 6)).toBe(false);
		expect(metric.greaterThan(5, 4.999)).toBe(true);
		expect(metric.greaterThan(5, 5.001)).toBe(false);
		expect(metric.greaterThan(5, 6.001)).toBe(false);
	});

	it("should compare values for lessThan", () => {
		expect(metric.lessThan(5, 4)).toBe(false);
		expect(metric.lessThan(5, 5)).toBe(false);
		expect(metric.lessThan(5, 6)).toBe(true);
		expect(metric.lessThan(5, 4.999)).toBe(false);
		expect(metric.lessThan(5, 5.001)).toBe(true);
		expect(metric.lessThan(5, 6.001)).toBe(true);
	});

	it("should compare values for equalTo", () => {
		expect(metric.equalTo(5, 4)).toBe(false);
		expect(metric.equalTo(5, 5)).toBe(true);
		expect(metric.equalTo(5, 6)).toBe(false);
		expect(metric.equalTo(5, 4.999)).toBe(false);
		expect(metric.equalTo(5, 5.001)).toBe(false);
		expect(metric.equalTo(5, 6.001)).toBe(false);
	});

	it("should compare values for greaterThanOrEqualTo", () => {
		expect(metric.greaterThanOrEqualTo(5, 4)).toBe(true);
		expect(metric.greaterThanOrEqualTo(5, 5)).toBe(true);
		expect(metric.greaterThanOrEqualTo(5, 6)).toBe(false);
		expect(metric.greaterThanOrEqualTo(5, 4.999)).toBe(true);
		expect(metric.greaterThanOrEqualTo(5, 5.001)).toBe(false);
		expect(metric.greaterThanOrEqualTo(5, 6.001)).toBe(false);
	});

	it("should compare values for lessThanOrEqualTo", () => {
		expect(metric.lessThanOrEqualTo(5, 4)).toBe(false);
		expect(metric.lessThanOrEqualTo(5, 5)).toBe(true);
		expect(metric.lessThanOrEqualTo(5, 6)).toBe(true);
		expect(metric.lessThanOrEqualTo(5, 4.999)).toBe(false);
		expect(metric.lessThanOrEqualTo(5, 5.001)).toBe(true);
		expect(metric.lessThanOrEqualTo(5, 6.001)).toBe(true);
	});
});
