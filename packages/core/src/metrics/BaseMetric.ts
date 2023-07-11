export abstract class BaseMetric<ID extends string, ValueType> {
	id: ID;
	declare valueType: ValueType;
	abstract serializeValue(value: ValueType): string;
	abstract deserializeValue(value: string): ValueType;

	constructor(id: ID) {
		this.id = id;
	}
}
