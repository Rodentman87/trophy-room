import { Serializable } from "../CommonTypes";
import { BaseContextValue, ContextValue } from "./BaseContextValue";

export interface ContextStore<
	ContextValues extends BaseContextValue<string, unknown, Serializable>[]
> {
	store: {
		[Context in ContextValues[number]["id"]]: Context;
	};
}
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class ContextStore<
	ContextValues extends BaseContextValue<string, unknown, Serializable>[] = []
> {
	context = new Map<string, BaseContextValue<string, unknown, Serializable>>();
	contextValues = new Map<string, unknown>();

	/**
	 * Creates a new context store, generally you will only want one context store for your entire application.
	 * @param context The list of context values to be tracked by this store
	 * @param options The options for this store, including the save and load functions
	 */
	constructor(context: ContextValues) {
		context.forEach((metric) => {
			this.context.set(metric.id, metric);
			// Set the default values initially, but these will be overwritten when loading
			this.contextValues.set(metric.id, metric.defaultValue);
		});
		this.store = new Proxy(
			{},
			{
				get: (_target, prop) => {
					if (this.context.has(prop as string)) {
						return prop;
					}
					return undefined;
				},
			}
		) as ContextStore<ContextValues>["store"];
	}

	/**
	 * Takes a list of context keys and returns an object with the values of those keys
	 * @param keys The context keys to get the values of
	 * @returns An object with the values of the given context keys
	 */
	getContextValues(keys: string[]) {
		const out: Record<string, unknown> = {};
		keys.forEach((key) => {
			out[key] = this.getContextValue(key);
		});
		return out;
	}

	/**
	 * Returns the value of the given context, this will call the function to calculate the value for lazy context values
	 * @param id The context to get the value of
	 */
	getContextValue<ID extends ContextValues[number]["id"]>(
		id: ID
	): Extract<ContextValues[number], { id: ID }> extends BaseContextValue<
		ID,
		infer T,
		Serializable
	>
		? T
		: never {
		const value = this.contextValues.get(id);
		// If the value is a function, call it and return the result, this is a lazy context value that will just be calculated when saved
		if (typeof value === "function") {
			return value();
		}
		// We know that this will be correct as long as the user isn't violating the type system
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return value as any;
	}

	/**
	 * Sets a new value for the given context, this will overwrite any existing value
	 * @param id The context to set the value of
	 * @param value Either the value to set, or a function that will be called to calculate the value
	 */
	setContextValue<ID extends ContextValues[number]["id"]>(
		id: ID,
		value: Extract<ContextValues[number], { id: ID }> extends BaseContextValue<
			ID,
			infer T,
			Serializable
		>
			? ContextValue<T>
			: never
	) {
		this.contextValues.set(id, value);
	}
}
