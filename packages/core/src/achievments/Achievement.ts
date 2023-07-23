import { ContextStore } from "../context/ContextStore";
import { AchievementMetricRequirement } from "../metrics/MetricsStore";

export interface AchievementOptions<
	ID extends string,
	ContextKeys extends string
> {
	id: ID;
	metrics: AchievementMetricRequirement;
	contextKeys?: ContextKeys[];
}

export class Achievement<
	ID extends string,
	ContextKeys extends string,
	Context extends ContextStore = ContextStore
> {
	id: ID;
	metrics: AchievementMetricRequirement;
	contextKeys: ContextKeys[];
	declare contextType: Context;

	constructor({
		id,
		metrics,
		contextKeys,
	}: AchievementOptions<ID, ContextKeys>) {
		this.id = id;
		this.metrics = metrics;
		this.contextKeys = contextKeys ?? [];
	}
}
