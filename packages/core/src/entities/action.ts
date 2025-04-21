import type { SelectQuery } from "../query";
import type { CommonSchema, GetTableNames } from "../schema";
import { entityType } from "./entity-type";
import {
  createCheckHelpers,
  createRelationsProxyForAuthCheck,
  type CheckFn,
  type PermissionCheck,
} from "./permission-check";
import type { AnySubject } from "./subject";

export class Action<
  Schema extends CommonSchema,
  Name extends string,
  ParentSubject extends AnySubject<Schema>,
  Result extends string,
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
    result: Result;
  };

  public readonly [entityType] = "action";
  public readonly name: Name;
  public readonly parent: ParentSubject;
  public readonly authCheck: PermissionCheck<Result>;

  constructor(
    name: Name,
    parent: ParentSubject,
    checkFn: CheckFn<ParentSubject, Result>,
  ) {
    this.name = name;
    this.parent = parent;
    this.authCheck = checkFn(
      createRelationsProxyForAuthCheck(parent),
      createCheckHelpers(),
    );
  }

  public select(
    query: SelectQuery<Schema, ParentSubject["_"]["name"]>,
  ): ActionSelect<
    Schema,
    Result extends GetTableNames<Schema> ? Result : never
  > {
    return new ActionSelect(this as any, query);
  }
}

export type AnyAction<
  Schema extends CommonSchema = any,
  Name extends string = any,
  ParentSubject extends AnySubject<Schema> = AnySubject<Schema>,
  Result extends string = any,
> = Action<Schema, Name, ParentSubject, Result>;

export class ActionSelect<
  Schema extends CommonSchema,
  OutputSubjectName extends GetTableNames<Schema>,
> {
  public readonly [entityType] = "actionSelect";
  public readonly action: AnyAction;
  public readonly query: SelectQuery<Schema, OutputSubjectName>;
  declare readonly _: {
    output: OutputSubjectName;
  };

  constructor(
    parent: AnyAction,
    query: SelectQuery<Schema, OutputSubjectName>,
  ) {
    this.action = parent;
    this.query = query;
  }
}
