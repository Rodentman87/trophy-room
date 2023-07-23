import { Serializable } from "../CommonTypes";

export type ContextValue<ValueType> = ValueType | (() => ValueType);

export class BaseContextValue<
	ID extends string,
	ValueType,
	Serialized extends Serializable
> {
	id: ID;
	defaultValue: ContextValue<ValueType>;
	serializeValue(value: ValueType): Serialized {
		return value as unknown as Serialized;
	}
	deserializeValue(value: Serialized): ValueType {
		return value as unknown as ValueType;
	}

	constructor(id: ID, defaultValue: ContextValue<ValueType>) {
		this.id = id;
		this.defaultValue = defaultValue;
	}
}
