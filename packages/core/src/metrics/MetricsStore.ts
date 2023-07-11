import { BaseMetric } from "./BaseMetric";

type MetricValueType<
	Metrics extends BaseMetric<string, unknown>[],
	ID extends Metrics[number]["id"]
> = Extract<Metrics[number], { id: ID }>["valueType"];

export type AchievementMetric =
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
}

export interface AchievementMetricOr {
	type: "or";
	metrics: AchievementMetric[];
}

export interface AchievementMetricAnd {
	type: "and";
	metrics: AchievementMetric[];
}

export interface AchievementMetricNot {
	type: "not";
	metric: AchievementMetric;
}

export interface AchievementMetricNever {
	type: "never";
}

type Prettify<T> = T & {};

export interface MetricsStore<Metrics extends BaseMetric<string, unknown>[]> {
	require: {
		[Metric in Metrics[number]["id"]]: Prettify<{
			[CompareFunction in keyof Extract<
				Metrics[number],
				{ id: Metric }
			> as Extract<Metrics[number], { id: Metric }>[CompareFunction] extends (
				value: Extract<Metrics[number], { id: Metric }>["valueType"],
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				target: any
			) => boolean
				? CompareFunction
				: never]: Extract<
				Metrics[number],
				{ id: Metric }
			>[CompareFunction] extends (
				value: Extract<Metrics[number], { id: Metric }>["valueType"],
				target: infer T
			) => boolean
				? (value: T) => AchievementMetricComparison
				: never;
		}>;
	};
}
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class MetricsStore<Metrics extends BaseMetric<string, unknown>[]> {
	metrics = new Map<string, BaseMetric<string, unknown>>();
	declare metricsKeys: Metrics[number]["id"];

	constructor(metrics: Metrics) {
		metrics.forEach((metric) => {
			this.metrics.set(metric.id, metric);
		});
		this.require = new Proxy(
			{},
			{
				get: (_target, metric) => {
					if (this.metrics.has(metric.toString())) {
						return new Proxy(
							{},
							{
								get: (_target, comparisonFunction) => {
									if (
										comparisonFunction.toString() in
										this.metrics.get(metric.toString())!
									) {
										return (value: unknown) => ({
											type: "comparison",
											metric: metric.toString(),
											comparisonType: comparisonFunction.toString(),
											value,
										});
									}
									throw new Error(
										`Invalid comparison function ${metric.toString()}`
									);
								},
							}
						);
					}
				},
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		) as any;
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
	setMetric<
		ID extends Metrics[number]["id"],
		ValueType extends MetricValueType<Metrics, ID>
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
	>(id: ID, valueOrFunction: ValueType | ((oldValue: ValueType) => ValueType)) {
		// TODO
	}

	getMetric<ID extends this["metricsKeys"]>(
		id: ID
	): Extract<Metrics[number], { id: ID }> {
		return this.metrics.get(id) as Extract<Metrics[number], { id: ID }>;
	}

	and(...metrics: AchievementMetric[]): AchievementMetricAnd {
		return {
			type: "and",
			metrics,
		};
	}

	or(...metrics: AchievementMetric[]): AchievementMetricOr {
		return {
			type: "or",
			metrics,
		};
	}

	not(metric: AchievementMetric): AchievementMetricNot {
		return {
			type: "not",
			metric,
		};
	}

	never(): AchievementMetricNever {
		return {
			type: "never",
		};
	}
}
