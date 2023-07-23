import { BaseContextValue } from "./BaseContextValue";

export class NumberContextValue<ID extends string> extends BaseContextValue<
	ID,
	number,
	number
> {}
