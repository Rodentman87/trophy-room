import {
	Achievement,
	BaseMetric,
	MetricValueType,
	TrophyRoom,
} from "@trophy-room/core";
import { Serializable } from "@trophy-room/core/dist/CommonTypes";
import { useSyncExternalStore } from "react";

export function createUseMetric<
	Metrics extends BaseMetric<string, unknown, Serializable>[]
>(useTrophyRoom: () => TrophyRoom<Metrics, Achievement<string, string>[]>) {
	return function useMetric<ID extends Metrics[number]["id"]>(
		metricId: ID
	): readonly [
		Extract<Metrics[number], { id: ID }>["valueType"],
		(valueOrFunction: MetricValueType<Metrics, ID>) => void
	] {
		const trophyRoom = useTrophyRoom();
		const value = useSyncExternalStore(
			(onChange) => {
				const handler = (ids: string[]) => {
					if (ids.includes(metricId)) onChange();
				};
				trophyRoom.metrics.on("metricsUpdated", handler);
				return () => {
					trophyRoom.metrics.off("metricsUpdated", handler);
				};
			},
			() => trophyRoom.metrics.getMetricValue(metricId)
		);
		return [value, trophyRoom.metrics.getMetricSetter(metricId)] as const;
	};
}
