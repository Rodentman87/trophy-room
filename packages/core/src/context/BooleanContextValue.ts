import { BaseContextValue } from "./BaseContextValue";

export class BooleanContextValue<ID extends string> extends BaseContextValue<
	ID,
	boolean,
	boolean
> {}
