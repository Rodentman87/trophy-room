import { Serializable } from "../CommonTypes";
import { BaseContextValue } from "./BaseContextValue";

export class PlainObjectContextValue<
	ID extends string,
	Type extends { [key: string]: Serializable }
> extends BaseContextValue<ID, Type, Type> {}
