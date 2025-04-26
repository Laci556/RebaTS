import { type RelationRefPlaceholder } from "../query";
import type { CommonSchema } from "../schema";
import { entityType } from "./entity-type";
import {
  NestedRelationCheck,
  RootNestedRelationCheck,
  type NestedRelationCheckHelpers,
  type NestedRelationCheckOrQuery,
  type ParentRelationsProxy,
} from "./relation-check";
import type { AnySubject } from "./subject";

export type RelationConnectionFn<
  Schema extends CommonSchema,
  ParentSubject extends AnySubject<Schema>,
  TargetSubject extends AnySubject<Schema>,
> = (
  target: RelationRefPlaceholder<
    TargetSubject["_"]["name"],
    TargetSubject["_"]["attributes"]
  >,
  parent: ParentRelationsProxy<
    Schema,
    ParentSubject,
    TargetSubject["_"]["name"]
  >,
  helpers: NestedRelationCheckHelpers<
    Schema,
    ParentSubject["_"]["name"],
    TargetSubject["_"]["name"]
  >,
) => NestedRelationCheckOrQuery<
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
  private readonly _connectionFn: RelationConnectionFn<
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
    this._connectionFn = connectionFn;
  }

  public connectionFn(
    target: RelationRefPlaceholder<
      TargetSubject["_"]["name"],
      TargetSubject["_"]["attributes"]
    >,
    parent: ParentRelationsProxy<
      Schema,
      ParentSubject,
      TargetSubject["_"]["name"]
    >,
    helpers: NestedRelationCheckHelpers<
      Schema,
      ParentSubject["_"]["name"],
      TargetSubject["_"]["name"]
    >,
  ): NestedRelationCheck<
    Schema,
    ParentSubject["_"]["name"],
    TargetSubject["_"]["name"]
  > {
    const connection = this._connectionFn(target, parent, helpers);
    if (connection instanceof NestedRelationCheck) {
      return connection;
    }
    return new RootNestedRelationCheck(connection);
  }
}

export type AnyRelation = Relation<any, any, any, any>;
