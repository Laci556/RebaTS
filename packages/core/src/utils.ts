const rebatsTypeError = Symbol("RebaTSTypeError");

type Branded<T, B> = T & { __brand: B };
export type RebaTSTypeError<T extends string> = Branded<
  T,
  typeof rebatsTypeError
>;
