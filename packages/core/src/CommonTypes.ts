export type Serializable =
	| string
	| number
	| boolean
	| null
	| undefined
	| Serializable[]
	| { [key: string]: Serializable };

// This type is a bit of a hack, but it makes mapped types much more readable for the end user.
// eslint-disable-next-line @typescript-eslint/ban-types
export type Prettify<T> = T & {};
