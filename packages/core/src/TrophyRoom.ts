import { BaseMetric, MetricsStore } from "./metrics";
import { Serializable } from "./metrics/BaseMetric";

export interface TrophyRoomOptions<
	Metrics extends BaseMetric<string, unknown, Serializable>[]
> {
	metrics: MetricsStore<Metrics>;
}

export class TrophyRoom<Metrics extends BaseMetric<string, unknown, Serializable>[]> {
	metrics: MetricsStore<Metrics>;

	constructor({ metrics }: TrophyRoomOptions<Metrics>) {
		this.metrics = metrics;
	}
}
