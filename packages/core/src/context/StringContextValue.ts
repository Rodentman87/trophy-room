import { BaseContextValue } from "./BaseContextValue";

export class StringContextValue<ID extends string> extends BaseContextValue<
	ID,
	string,
	string
> {}
