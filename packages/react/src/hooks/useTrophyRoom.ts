import { Achievement, BaseMetric, TrophyRoom } from "@trophy-room/core";
import { Serializable } from "@trophy-room/core/dist/CommonTypes";
import { useContext } from "react";
import { TrophyRoomContext } from "../TrophyRoomContext";

export function createUseTrophyRoom<
	T extends TrophyRoom<
		BaseMetric<string, unknown, Serializable>[],
		Achievement<string, string>[]
	>
>() {
	return function useTrophyRoom() {
		const trophyRoom = useContext(TrophyRoomContext);
		if (!trophyRoom) {
			throw new Error(
				"Cannot use useTrophyRoom outside of a TrophyRoomProvider"
			);
		}
		return trophyRoom as T;
	};
}
