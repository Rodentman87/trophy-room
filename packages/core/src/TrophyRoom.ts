import { BaseMetric, MetricsStore } from "./metrics";

export interface TrophyRoomOptions<
	Metrics extends BaseMetric<string, unknown>[]
> {
	metrics: MetricsStore<Metrics>;
}

export class TrophyRoom<Metrics extends BaseMetric<string, unknown>[]> {
	metrics: MetricsStore<Metrics>;

	constructor({ metrics }: TrophyRoomOptions<Metrics>) {
		this.metrics = metrics;
	}
}
