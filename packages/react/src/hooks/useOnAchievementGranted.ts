import { Achievement, BaseMetric, TrophyRoom } from "@trophy-room/core";
import { Serializable } from "@trophy-room/core/dist/CommonTypes";
import { useEffect } from "react";

export function createUseOnAchievementGranted<
	T extends TrophyRoom<
		BaseMetric<string, unknown, Serializable>[],
		Achievement<string, string>[]
	>,
	A extends Achievement<string, string>
>(useTrophyRoom: () => T) {
	return function useOnAchievementGranted(callback: (achievement: A) => void) {
		const trophyRoom = useTrophyRoom();
		useEffect(() => {
			const handler = (achievementId: string) => {
				const achievement =
					trophyRoom.achievements.getAchievement(achievementId);
				callback(achievement as A);
			};
			trophyRoom.achievements.on("achievementGranted", handler);
			return () => {
				trophyRoom.achievements.off("achievementGranted", handler);
			};
		}, [callback]);
	};
}
