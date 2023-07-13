export type Serializable =
	| string
	| number
	| boolean
	| null
	| undefined
	| Serializable[]
	| { [key: string]: Serializable };

export abstract class BaseMetric<
	ID extends string,
	ValueType,
	Serialized extends Serializable
> {
	id: ID;
	defaultValue: ValueType;
	declare valueType: ValueType;
	serializeValue(value: ValueType): Serialized {
		return value as unknown as Serialized;
	}
	deserializeValue(value: Serialized): ValueType {
		return value as unknown as ValueType;
	}

	constructor(id: ID, defaultValue: ValueType) {
		this.id = id;
		this.defaultValue = defaultValue;
	}
}
