import {
	Achievement,
	BaseMetric,
	ContextShape,
	TrophyRoom,
} from "@trophy-room/core";
import { Serializable } from "@trophy-room/core/dist/CommonTypes";
import { useSyncExternalStore } from "react";

export function createUseAchievement<
	Achievements extends Achievement<string, string>[]
>(
	useTrophyRoom: () => TrophyRoom<
		BaseMetric<string, unknown, Serializable>[],
		Achievements
	>
) {
	return function useAchievement<ID extends Achievements[number]["id"]>(
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
	] {
		const trophyRoom = useTrophyRoom();
		const achievement = trophyRoom.achievements.getAchievement(achievementId);
		const metadata = useSyncExternalStore(
			(onChange) => {
				const handler = (id: string) => {
					if (id === achievementId) onChange();
				};
				trophyRoom.achievements.on("achievementGranted", handler);
				trophyRoom.achievements.on("achievementRevoked", handler);
				return () => {
					trophyRoom.achievements.off("achievementGranted", handler);
					trophyRoom.achievements.off("achievementRevoked", handler);
				};
			},
			() => trophyRoom.achievements.getAchievementMetadata(achievementId)
		);
		return [achievement, metadata] as const;
	};
}
