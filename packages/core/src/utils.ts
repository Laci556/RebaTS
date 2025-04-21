const rebatsTypeError = Symbol("RebaTSTypeError");

export type RebaTSTypeError<T extends string> = Branded<
  T,
  typeof rebatsTypeError
>;

export type NonEmptyTuple<T> = readonly [T, ...T[]];

export type Branded<T, B> = T & { __brand: B };
