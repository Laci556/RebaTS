import { RelationRef, type SchemaQuery } from "../query";
import type { CommonSchema, GetTableNames } from "../schema";
import { entityType } from "./entity-type";
import type { AnyRelation } from "./relation";
import type { AnySubject } from "./subject";

export type ParentRelationsProxy<
  Schema extends CommonSchema,
  Parent extends AnySubject,
  Target extends GetTableNames<Schema>,
> = {
  [Key in keyof Parent["_"]["relations"] as Parent["_"]["relations"][Key]["_"]["target"]["_"]["name"] extends Target
    ? Key
    : never]: ParentNestedRelationCheck<Schema, Parent["_"]["name"], Target>;
};

export function createParentNestedRelationsProxy<
  Schema extends CommonSchema,
  Parent extends AnySubject,
  Target extends GetTableNames<Schema>,
>(parent: Parent): ParentRelationsProxy<Schema, Parent, Target> {
  return new Proxy({} as any, {
    get(_, prop) {
      const relation = parent["relationsMap"].get(prop as string);
      if (!relation) {
        throw new TypeError("Invalid relation");
      }
      return new ParentNestedRelationCheck(relation);
    },
  });
}

export type NestedRelationCheckOrQuery<
  Schema extends CommonSchema,
  Parent extends GetTableNames<Schema>,
  Target extends GetTableNames<Schema>,
> =
  | NestedRelationCheck<Schema, Parent, Target>
  | SchemaQuery<Schema, Parent, Target>;

export abstract class NestedRelationCheck<
  Schema extends CommonSchema,
  Parent extends GetTableNames<Schema>,
  Target extends GetTableNames<Schema>,
> {
  declare readonly _: {
    parent: Parent;
    target: Target;
  };

  public readonly [entityType] = "nestedRelationCheck";

  public abstract toQuery(query: any): any;
}

export class RootNestedRelationCheck<
  Schema extends CommonSchema,
  Parent extends GetTableNames<Schema>,
  Target extends GetTableNames<Schema>,
> extends NestedRelationCheck<Schema, Parent, Target> {
  constructor(
    private readonly child: NestedRelationCheckOrQuery<Schema, Parent, Target>,
  ) {
    super();
  }

  public toQuery(query: any): any {
    return this.child instanceof NestedRelationCheck
      ? this.child.toQuery(query)
      : this.child;
  }
}

export class ParentNestedRelationCheck<
  Schema extends CommonSchema,
  Parent extends GetTableNames<Schema>,
  Target extends GetTableNames<Schema>,
> extends NestedRelationCheck<Schema, Parent, Target> {
  constructor(private readonly child: AnyRelation) {
    super();
  }

  public toQuery(query: any): any {
    return this.child
      .connectionFn(
        new RelationRef(this.child.reference(), query),
        createParentNestedRelationsProxy(this.child.parent),
        nestedRelationCheckHelpers,
      )
      .toQuery(query);
  }
}

class OrNestedRelationCheck<
  Schema extends CommonSchema,
  Parent extends GetTableNames<Schema>,
  Target extends GetTableNames<Schema>,
> extends NestedRelationCheck<Schema, Parent, Target> {
  constructor(
    private readonly children: NestedRelationCheckOrQuery<
      Schema,
      Parent,
      Target
    >[],
  ) {
    super();
  }

  public toQuery(query: any): any {
    return {
      $or: this.children.map((child) =>
        child instanceof NestedRelationCheck ? child.toQuery(query) : child,
      ),
    };
  }
}

class AndNestedRelationCheck<
  Schema extends CommonSchema,
  Parent extends GetTableNames<Schema>,
  Target extends GetTableNames<Schema>,
> extends NestedRelationCheck<Schema, Parent, Target> {
  constructor(
    private readonly children: NestedRelationCheckOrQuery<
      Schema,
      Parent,
      Target
    >[],
  ) {
    super();
  }

  public toQuery(query: any): any {
    return {
      $and: this.children.map((child) =>
        child instanceof NestedRelationCheck ? child.toQuery(query) : child,
      ),
    };
  }
}

class NotNestedRelationCheck<
  Schema extends CommonSchema,
  Parent extends GetTableNames<Schema>,
  Target extends GetTableNames<Schema>,
> extends NestedRelationCheck<Schema, Parent, Target> {
  constructor(
    private readonly child: NestedRelationCheckOrQuery<Schema, Parent, Target>,
  ) {
    super();
  }

  public toQuery(query: any): any {
    return {
      $not:
        this.child instanceof NestedRelationCheck
          ? this.child.toQuery(query)
          : this.child,
    };
  }
}

export type NestedRelationCheckHelpers<
  Schema extends CommonSchema,
  Parent extends GetTableNames<Schema>,
  Target extends GetTableNames<Schema>,
> = {
  and: (
    ...children: [
      NestedRelationCheckOrQuery<Schema, Parent, Target>,
      ...NestedRelationCheckOrQuery<Schema, Parent, Target>[],
    ]
  ) => AndNestedRelationCheck<Schema, Parent, Target>;
  or: (
    ...children: [
      NestedRelationCheckOrQuery<Schema, Parent, Target>,
      ...NestedRelationCheckOrQuery<Schema, Parent, Target>[],
    ]
  ) => OrNestedRelationCheck<Schema, Parent, Target>;
  not: (
    child: NestedRelationCheckOrQuery<Schema, Parent, Target>,
  ) => NotNestedRelationCheck<Schema, Parent, Target>;
};

export function createNestedRelationCheckHelpers<
  Schema extends CommonSchema,
  Parent extends GetTableNames<Schema>,
  Target extends GetTableNames<Schema>,
>(): NestedRelationCheckHelpers<Schema, Parent, Target> {
  return {
    and: (...children) => new AndNestedRelationCheck(children),
    or: (...children) => new OrNestedRelationCheck(children),
    not: (child) => new NotNestedRelationCheck(child),
  };
}
export const nestedRelationCheckHelpers = createNestedRelationCheckHelpers();
