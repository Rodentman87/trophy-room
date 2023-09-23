import EventEmitter from "eventemitter3";
import { Prettify, Serializable } from "../CommonTypes";
import { BaseMetric } from "./BaseMetric";

export type MetricValueType<
	Metrics extends BaseMetric<string, unknown, Serializable>[],
	ID extends Metrics[number]["id"]
> = Extract<Metrics[number], { id: ID }>["valueType"];

export type AchievementMetricRequirement =
	| AchievementMetricComparison
	| AchievementMetricOr
	| AchievementMetricAnd
	| AchievementMetricNot
	| AchievementMetricNever;

export interface AchievementMetricComparison {
	type: "comparison";
	metric: string;
	comparisonType: string;
	value: unknown;
	options?: unknown;
}

export interface AchievementMetricOr {
	type: "or";
	metrics: AchievementMetricRequirement[];
}

export interface AchievementMetricAnd {
	type: "and";
	metrics: AchievementMetricRequirement[];
}

export interface AchievementMetricNot {
	type: "not";
	metric: AchievementMetricRequirement;
}

export interface AchievementMetricNever {
	type: "never";
}

interface MetricStoreEvents {
	metricsUpdated: (metrics: string[]) => void;
}

export interface MetricsStoreOptions {
	save: (serialized: string) => void | Promise<void>;
	load: () => string | Promise<string>;
}

export interface MetricsStore<
	Metrics extends BaseMetric<string, unknown, Serializable>[]
> {
	require: {
		[Metric in Metrics[number]["id"]]: Prettify<{
			[CompareFunction in keyof Extract<
				Metrics[number],
				{ id: Metric }
			> as Extract<Metrics[number], { id: Metric }>[CompareFunction] extends (
				value: Extract<Metrics[number], { id: Metric }>["valueType"],
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				target: any,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				options?: any
			) => boolean
				? CompareFunction
				: never]: Extract<
				Metrics[number],
				{ id: Metric }
			>[CompareFunction] extends (
				value: Extract<Metrics[number], { id: Metric }>["valueType"],
				target: infer T,
				options: infer O
			) => boolean
				? unknown extends O
					? (value: T) => AchievementMetricComparison
					: undefined extends O
					? (value: T, options?: O) => AchievementMetricComparison
					: (value: T, options: O) => AchievementMetricComparison
				: never;
		}>;
	};
}
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class MetricsStore<
	Metrics extends BaseMetric<string, unknown, Serializable>[]
> extends EventEmitter<MetricStoreEvents> {
	metrics = new Map<string, BaseMetric<string, unknown, Serializable>>();
	metricValues = new Map<string, unknown>();
	saveFunction: MetricsStoreOptions["save"];
	loadFunction: MetricsStoreOptions["load"];
	private updatingMultiple = false;
	private updatedMetrics: string[] = [];

	/**
	 * Creates a new metrics store, generally you will only want one metrics store for your entire application.
	 * @param metrics The list of metrics to be tracked by this store
	 * @param options The options for this store, including the save and load functions
	 */
	constructor(metrics: Metrics, options: MetricsStoreOptions) {
		super();
		metrics.forEach((metric) => {
			this.metrics.set(metric.id, metric);
			// Set the default values initially, but these will be overwritten when loading
			this.metricValues.set(metric.id, metric.defaultValue);
		});
		this.setMetricValue = this.setMetricValue.bind(this);
		// The first proxy here handles the metric name (`store.require.points`)
		this.require = new Proxy(
			{},
			{
				get: (_target, metric) => {
					if (this.metrics.has(metric.toString())) {
						// This second proxy handles the comparison function (`store.require.points.greaterThan`) and returns a function that can be called with a value and options
						return new Proxy(
							{},
							{
								get: (_target, comparisonFunction) => {
									if (
										comparisonFunction.toString() in
										this.metrics.get(metric.toString())!
									) {
										return (value: unknown, options?: unknown) => ({
											type: "comparison",
											metric: metric.toString(),
											comparisonType: comparisonFunction.toString(),
											value,
											options,
										});
									}
									throw new Error(
										`Invalid comparison function ${metric.toString()}`
									);
								},
							}
						);
					} else {
						throw new Error(`Invalid metric ${metric.toString()}`);
					}
				},
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		) as any;
		// Assign the save and load functions
		this.saveFunction = options.save;
		this.loadFunction = options.load;
	}

	/**
	 * Call this function to load the metrics from the load function provided in the constructor.
	 * This is called when your TrophyRoom is created, but you can call it manually if you need to.
	 */
	async loadMetrics() {
		const serialized = await this.loadFunction();
		const parsed = JSON.parse(serialized);
		Object.entries(parsed).forEach(([id, value]) => {
			const metric = this.metrics.get(id);
			if (!metric) return; // Ignore invalid metrics, since they may have been removed
			this.metricValues.set(id, metric.deserializeValue(value as Serializable));
		});
	}

	/**
	 * Call this function to save the metrics to the save function provided in the constructor.
	 * This is called automatically when a metric is updated, but you can call it manually if you need to.
	 */
	async saveMetrics() {
		const serialized = JSON.stringify(
			Object.fromEntries(
				Array.from(this.metricValues.entries()).map(([id, value]) => [
					id,
					this.metrics.get(id)!.serializeValue(value),
				])
			)
		);
		await this.saveFunction(serialized);
	}

	/**
	 * If you need to update multiple metrics at once, you can use this function to skip saving the metrics until the end,
	 * rather than saving them after each metric is updated.
	 * @param runner A function that will be run, and any metrics that are updated will be saved all at once
	 */
	updateMultiple(runner: () => void) {
		this.updatingMultiple = true;
		this.updatedMetrics = [];
		runner();
		this.updatingMultiple = false;
		this.saveMetrics();
		this.emit("metricsUpdated", this.updatedMetrics);
	}

	// TODO waiting on https://github.com/microsoft/TypeScript/issues/54965 to uncomment these
	// setMetric<
	// 	ID extends Metrics[number]["id"],
	// 	ValueType extends MetricValueType<Metrics, ID>
	// >(id: ID, value: (oldValue: ValueType) => ValueType): void;
	// setMetric<
	// 	ID extends Metrics[number]["id"],
	// 	ValueType extends MetricValueType<Metrics, ID>
	// >(id: ID, value: ValueType): void;
	/**
	 * Call this function to update a metric, this will automatically save the metric to the save function provided in the constructor.
	 * @param id The id of the metric you want to update
	 * @param valueOrFunction The new value of the metric, or a function that will be called with the current value and should return the new value
	 */
	setMetricValue<
		ID extends Metrics[number]["id"],
		ValueType extends MetricValueType<Metrics, ID>
	>(id: ID, valueOrFunction: ValueType | ((oldValue: ValueType) => ValueType)) {
		// Get the metric itself
		const metric = this.metrics.get(id);
		if (!metric) throw new Error(`Invalid metric ${id}`);
		// Get the current value of the metric
		const currentValue = this.metricValues.get(id)! as ValueType;
		// If the value is a function, call it with the current value
		const newValue =
			valueOrFunction instanceof Function
				? valueOrFunction(currentValue)
				: valueOrFunction;
		// Set the new value
		this.metricValues.set(id, newValue);
		// Save the metrics
		if (!this.updatingMultiple) {
			this.saveMetrics();
			this.emit("metricsUpdated", [id]);
		} else {
			this.updatedMetrics.push(id);
		}
	}

	/**
	 * This returns a function that can be used to update a metric, this is useful if you want to pass a function to another function.
	 * @param id The id of the metric you want to get the setter for
	 * @returns A function that can be called to set the metric's value
	 */
	getMetricSetter<
		ID extends Metrics[number]["id"],
		ValueType extends MetricValueType<Metrics, ID>
	>(id: ID) {
		return (
			valueOrFunction: ValueType | ((oldValue: ValueType) => ValueType)
		) => {
			this.setMetricValue(id, valueOrFunction);
		};
	}

	/**
	 * Takes an id and returns the metric with that id, this is useful if you want to get the description of a metric.
	 * This does not return the value of the metric, to get the value of a metric use `store.getMetricValue`.
	 * @param id The id of the metric you want to get
	 * @returns The description of the metric
	 */
	getMetric<ID extends Metrics[number]["id"]>(
		id: ID
	): Extract<Metrics[number], { id: ID }> {
		return this.metrics.get(id) as Extract<Metrics[number], { id: ID }>;
	}

	/**
	 * Returns the current value of a metric.
	 * @param id The id of the metric you want to get the value of
	 * @returns The value of the metric
	 */
	getMetricValue<ID extends Metrics[number]["id"]>(
		id: ID
	): Extract<Metrics[number], { id: ID }>["valueType"] {
		return this.metricValues.get(id) as Extract<
			Metrics[number],
			{ id: ID }
		>["valueType"];
	}

	/**
	 * Creates a metric requirement where all the given requirements must be true.
	 * @param metrics The metrics that must all be true
	 */
	and(...metrics: AchievementMetricRequirement[]): AchievementMetricAnd {
		return {
			type: "and",
			metrics,
		};
	}

	/**
	 * Creates a metric requirement where any of the given requirements must be true.
	 * @param metrics The metrics where any of them can be true
	 */
	or(...metrics: AchievementMetricRequirement[]): AchievementMetricOr {
		return {
			type: "or",
			metrics,
		};
	}

	/**
	 * Creates a metric requirement where the given requirement must be false.
	 * @param metric The metric to negate
	 */
	not(metric: AchievementMetricRequirement): AchievementMetricNot {
		return {
			type: "not",
			metric,
		};
	}

	/**
	 * Creates a special metric requirement that never passes.
	 * This is useful if you want an achievement to only be granted manually.
	 */
	never(): AchievementMetricNever {
		return {
			type: "never",
		};
	}
}
