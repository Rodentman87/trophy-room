import {
	Achievement,
	BaseMetric,
	ContextShape,
	MetricValueType,
	TrophyRoom,
} from "@trophy-room/core";
import { Serializable } from "@trophy-room/core/dist/CommonTypes";
import { createUseAchievement } from "./useAchievement";
import { createUseMetric } from "./useMetric";
import { createUseOnAchievementGranted } from "./useOnAchievementGranted";
import { createUseTrophyRoom } from "./useTrophyRoom";

export function createHooks<
	T extends TrophyRoom<
		BaseMetric<string, unknown, Serializable>[],
		Achievement<string, string>[]
	>,
	A extends Achievement<string, string>
>(
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	trophyRoom: T,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	customAchievementClass?: A
): T extends TrophyRoom<infer Metrics, infer Achievements>
	? {
			useMetric<
				ID extends Metrics[number]["id"],
				ValueType extends MetricValueType<Metrics, ID>
			>(
				metricId: ID
			): readonly [
				Extract<Metrics[number], { id: ID }>["valueType"],
				(
					valueOrFunction: ValueType | ((oldValue: ValueType) => ValueType)
				) => void
			];
			useOnAchievementGranted(callback: (achievement: A) => void): void;
			useAchievement<ID extends Achievements[number]["id"]>(
				achievementId: ID
			): readonly [
				Extract<Achievements[number], { id: ID }>,
				Extract<Achievements[number], { id: ID }> extends Achievement<
					string,
					infer ContextKeys,
					infer Context
				>
					? ContextShape<Context, ContextKeys>
					: never
			];
			useTrophyRoom(): T;
			// eslint-disable-next-line @typescript-eslint/ban-types
	  } & {}
	: never {
	const useTrophyRoom = createUseTrophyRoom<T>();
	return {
		useMetric: createUseMetric(useTrophyRoom),
		useOnAchievementGranted: createUseOnAchievementGranted<T, A>(useTrophyRoom),
		useAchievement: createUseAchievement(useTrophyRoom),
		useTrophyRoom,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} as any;
}
