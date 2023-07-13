import { StringMetric } from "./StringMetric"

describe("StringMetric", () => {
    const metric = new StringMetric("test", "");

    it("should serialize values", () => {
		expect(metric.serializeValue("foo")).toBe("foo");
		expect(metric.serializeValue("🏳️‍⚧️")).toBe("🏳️‍⚧️");
	});

	it("should deserialize values", () => {
		expect(metric.deserializeValue("bar")).toBe("bar");
		expect(metric.deserializeValue("🏳️‍⚧️")).toBe("🏳️‍⚧️");
	});

    it("should transform input values", () => {
        expect(metric.transform(["foo", "bar"], {})).toEqual(["foo", ["bar"]]);
        expect(metric.transform(["foo", ["bar", "baz"]], {})).toEqual(["foo", ["bar", "baz"]]);
        expect(metric.transform(["Foo", ["bar", "Baz"]], {})).toEqual(["Foo", ["bar", "Baz"]]);
        expect(metric.transform(["Foo", ["Bar", "Baz"]], { ignoreCase: true })).toEqual(["foo", ["bar", "baz"]]);
        expect(metric.transform(["Foo", ["bar", "Baz"]], { ignoreCase: false })).toEqual(["Foo", ["bar", "Baz"]]);
    });

    it("should compare values for matchesOneOf", () => {
        expect(metric.matchesOneOf("foo", "foo")).toBe(true);
        expect(metric.matchesOneOf("foo", "bar")).toBe(false);
        expect(metric.matchesOneOf("Foo", "foo", { ignoreCase: false })).toBe(false);
        expect(metric.matchesOneOf("Foo", "foo", { ignoreCase: true })).toBe(true);
        expect(metric.matchesOneOf("foo", ["foo", "bar"])).toBe(true);
        expect(metric.matchesOneOf("foo", ["bar", "baz"])).toBe(false);
        expect(metric.matchesOneOf("Foo", ["foo", "bar"], { ignoreCase: false })).toBe(false);
        expect(metric.matchesOneOf("Foo", ["foo", "bar"], { ignoreCase: true })).toBe(true);
        expect(metric.matchesOneOf("foo", /foo/)).toBe(true);
        expect(metric.matchesOneOf("foo", /bar/)).toBe(false);

        // `ignoreCase` should be ignored when testing against a regular expression
        expect(metric.matchesOneOf("Foo", /foo/, { ignoreCase: true })).toBe(false);
    });

    it("should compare values for includesOneOf", () => {
        expect(metric.includesOneOf("foo", "o")).toBe(true);
        expect(metric.includesOneOf("foo", "e")).toBe(false);
        expect(metric.includesOneOf("foo", "oo")).toBe(true);
        expect(metric.includesOneOf("foo", "oe")).toBe(false);
        expect(metric.includesOneOf("FOO", "o", { ignoreCase: false })).toBe(false);
        expect(metric.includesOneOf("FOO", "o", { ignoreCase: true })).toBe(true);
        expect(metric.includesOneOf("foo", ["a", "e", "i", "o", "u"])).toBe(true);
        expect(metric.includesOneOf("FOO", ["a", "e", "i", "o", "u"], { ignoreCase: false })).toBe(false);
        expect(metric.includesOneOf("FOO", ["a", "e", "i", "o", "u"], { ignoreCase: true })).toBe(true);
    });

    it("should compare values for startsWithOneOf", () => {
        expect(metric.startsWithOneOf("foo", "f")).toBe(true);
        expect(metric.startsWithOneOf("foo", "fo")).toBe(true);
        expect(metric.startsWithOneOf("foo", "fooo")).toBe(false);
        expect(metric.startsWithOneOf("foo", "foa")).toBe(false);
        expect(metric.startsWithOneOf("foo", "b")).toBe(false);
        expect(metric.startsWithOneOf("Foo", "f", { ignoreCase: false })).toBe(false);
        expect(metric.startsWithOneOf("Foo", "f", { ignoreCase: true })).toBe(true);
        expect(metric.startsWithOneOf("foo", ["f", "o"])).toBe(true);
        expect(metric.startsWithOneOf("foo", ["fo", "oo"])).toBe(true);
        expect(metric.startsWithOneOf("foo", ["b", "oo" /* AAAHHH!! */])).toBe(false);
        expect(metric.startsWithOneOf("F", ["f", "oo"], { ignoreCase: false })).toBe(false);
        expect(metric.startsWithOneOf("F", ["f", "oo"], { ignoreCase: true })).toBe(true);
    });
    it("should compare values for endsWithOneOf", () => {
        expect(metric.endsWithOneOf("foo", "o")).toBe(true);
        expect(metric.endsWithOneOf("foo", "oo")).toBe(true);
        expect(metric.endsWithOneOf("foo", "ooo")).toBe(false);
        expect(metric.endsWithOneOf("foo", "oa")).toBe(false);
        expect(metric.endsWithOneOf("foo", "b")).toBe(false);
        expect(metric.endsWithOneOf("FOO", "o", { ignoreCase: false })).toBe(false);
        expect(metric.endsWithOneOf("FOO", "o", { ignoreCase: true })).toBe(true);
        expect(metric.endsWithOneOf("foo", ["e", "o"])).toBe(true);
        expect(metric.endsWithOneOf("foo", ["fo", "oo"])).toBe(true);
        expect(metric.endsWithOneOf("foo", ["f", "fo"])).toBe(false);
        expect(metric.endsWithOneOf("O", ["o", "oo"], { ignoreCase: false })).toBe(false);
        expect(metric.endsWithOneOf("O", ["o", "oo"], { ignoreCase: true })).toBe(true);
    });
})