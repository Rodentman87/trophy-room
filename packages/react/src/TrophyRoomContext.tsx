import { Achievement, BaseMetric, TrophyRoom } from "@trophy-room/core";
import { Serializable } from "@trophy-room/core/dist/CommonTypes";
import { createContext } from "react";

export const TrophyRoomContext = createContext<TrophyRoom<
	BaseMetric<string, unknown, Serializable>[],
	Achievement<string, string>[]
> | null>(null);

export const TrophyRoomProvider = TrophyRoomContext.Provider;
export const TrophyRoomConsumer = TrophyRoomContext.Consumer;
