import { TrophyRoom } from "@trophy-room/core";
import { createContext } from "react";

export const TrophyRoomContext = createContext<TrophyRoom<[], []> | null>(null);

export const TrophyRoomProvider = TrophyRoomContext.Provider;
export const TrophyRoomConsumer = TrophyRoomContext.Consumer;
