import { TrophyRoom } from "@trophy-room/core";
import { useContext } from "react";
import { TrophyRoomContext } from "../TrophyRoomContext";

export function createUseTrophyRoom<T extends TrophyRoom<[], []>>() {
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
