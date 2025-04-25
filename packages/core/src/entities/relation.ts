import type { RelationRefPlaceholder, SchemaQuery } from "../query";
import type { CommonSchema } from "../schema";
import { entityType } from "./entity-type";
import type { AnySubject } from "./subject";

/*
const parentRelationPlaceholderSymbol: unique symbol = Symbol(
  "parentRelationPlaceholder",
);

type ParentRelationPlaceholder = Branded<
  {},
  typeof parentRelationPlaceholderSymbol
>;

type ParentRelationsProxy<S extends AnySubject> = {
  [Key in keyof S["_"]["relations"]]: ParentRelationPlaceholder;
};
*/

export type RelationConnectionFn<
  Schema extends CommonSchema,
  ParentSubject extends AnySubject<Schema>,
  TargetSubject extends AnySubject<Schema>,
> = (
  target: RelationRefPlaceholder<
    TargetSubject["_"]["name"],
    TargetSubject["_"]["attributes"]
  >,
  // parent: ParentRelationsProxy<ParentSubject>,
  // TODO: union, intersection
) => SchemaQuery<
  Schema,
  ParentSubject["_"]["name"],
  TargetSubject["_"]["name"]
>;

export class Relation<
  Schema extends CommonSchema,
  Name extends string,
  ParentSubject extends AnySubject<Schema>,
  TargetSubject extends AnySubject<Schema>,
> {
  /**
   * Contains type information about the entity.
   * DO NOT USE THIS IN RUNTIME!
   *
   * @internal
   */
  declare readonly _: {
    name: Name;
    parent: ParentSubject;
    target: TargetSubject;
  };

  public readonly [entityType] = "relation";

  public readonly name: Name;
  public readonly parent: AnySubject;
  public readonly reference: () => AnySubject;
  public readonly connectionFn: RelationConnectionFn<
    Schema,
    ParentSubject,
    TargetSubject
  >;

  constructor(
    name: Name,
    parent: AnySubject,
    reference: () => TargetSubject,
    connectionFn: RelationConnectionFn<Schema, ParentSubject, TargetSubject>,
  ) {
    this.name = name;
    this.parent = parent;
    this.reference = reference;
    this.connectionFn = connectionFn;
  }
}

export type AnyRelation = Relation<any, any, any, any>;
