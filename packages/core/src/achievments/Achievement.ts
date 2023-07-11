import { AchievementMetric } from "../metrics/MetricsStore";

export interface AchievementOptions {
	id: string;
	metrics: AchievementMetric;
}

export class Achievement {
	id: string;
	metrics: AchievementOptions["metrics"];

	constructor({ id, metrics }: AchievementOptions) {
		this.id = id;
		this.metrics = metrics;
	}
}
