const authzTypeErrorSymbol = Symbol("AuthzTypeError");

export type AuthzTypeError<T extends string> = Branded<
  T,
  typeof authzTypeErrorSymbol
>;

export type NonEmptyTuple<T> = readonly [T, ...T[]];

export type Branded<T, B> = T & { __brand: B };
