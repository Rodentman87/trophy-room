import { ContextStore } from "./ContextStore";
import { NumberContextValue } from "./NumberContextValue";

describe("ContextStore", () => {
	const store = new ContextStore([
		new NumberContextValue("test", 0),
		new NumberContextValue("test2", () => 1),
	]);

	it("should store context values", () => {
		expect(store.getContextValue("test")).toBe(0);
		expect(store.getContextValue("test2")).toBe(1);
		store.setContextValue("test", 5);
		store.setContextValue("test2", () => 2);
		expect(store.getContextValue("test")).toBe(5);
		expect(store.getContextValue("test2")).toBe(2);
	});
});
