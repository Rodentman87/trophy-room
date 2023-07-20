import { AchievementMetricRequirement } from "../metrics/MetricsStore";

export interface AchievementOptions {
	id: string;
	metrics: AchievementMetricRequirement;
}

export class Achievement {
	id: string;
	metrics: AchievementOptions["metrics"];

	constructor({ id, metrics }: AchievementOptions) {
		this.id = id;
		this.metrics = metrics;
	}
}
