import { RelationRef } from "../query";
import { entityType } from "./entity-type";
import type { AnyRelation } from "./relation";
import {
  createParentNestedRelationsProxy,
  nestedRelationCheckHelpers,
} from "./relation-check";
import type { AnySubject, SubjectSelect } from "./subject";

export abstract class PermissionCheck<Target extends string> {
  declare readonly _: {
    target: Target;
  };

  public readonly [entityType] = "permissionCheck";

  public abstract toQuery(subject: SubjectSelect<any, any>): any;
}

export class RelationCheck<
  Target extends string,
> extends PermissionCheck<Target> {
  constructor(private readonly child: AnyRelation) {
    super();
  }

  public toQuery(who: SubjectSelect<any, any>): any {
    return this.child
      .connectionFn(
        new RelationRef<any, any>(who.outputSubject, who.query),
        createParentNestedRelationsProxy(this.child.parent),
        nestedRelationCheckHelpers,
      )
      .toQuery(who.query);
  }
}

export class OrCheck<Target extends string> extends PermissionCheck<Target> {
  constructor(private readonly children: PermissionCheck<Target>[]) {
    super();
  }

  public toQuery(who: SubjectSelect<any, any>): any {
    return {
      $or: this.children.map((child) => child.toQuery(who)),
    };
  }
}

export class AndCheck<Target extends string> extends PermissionCheck<Target> {
  constructor(private readonly children: PermissionCheck<Target>[]) {
    super();
  }

  public toQuery(who: SubjectSelect<any, any>): any {
    return {
      $and: this.children.map((child) => child.toQuery(who)),
    };
  }
}

export class NotCheck<Target extends string> extends PermissionCheck<Target> {
  constructor(private readonly child: PermissionCheck<Target>) {
    super();
  }

  public toQuery(who: SubjectSelect<any, any>): any {
    return {
      $not: this.child.toQuery(who),
    };
  }
}

export type CheckHelpers = {
  or: <Result extends string>(
    ...checks: [PermissionCheck<Result>, ...PermissionCheck<NoInfer<Result>>[]]
  ) => OrCheck<NoInfer<Result>>;
  and: <Result extends string>(
    ...checks: [PermissionCheck<Result>, ...PermissionCheck<NoInfer<Result>>[]]
  ) => AndCheck<NoInfer<Result>>;
  not: <Result extends string>(
    check: PermissionCheck<Result>,
  ) => NotCheck<NoInfer<Result>>;
};

export function createCheckHelpers(): CheckHelpers {
  return {
    or: <Result extends string>(
      ...checks: [
        PermissionCheck<Result>,
        ...PermissionCheck<NoInfer<Result>>[],
      ]
    ): OrCheck<NoInfer<Result>> => new OrCheck(checks),
    and: <Result extends string>(
      ...checks: [
        PermissionCheck<Result>,
        ...PermissionCheck<NoInfer<Result>>[],
      ]
    ): AndCheck<NoInfer<Result>> => new AndCheck(checks),
    not: <Result extends string>(
      check: PermissionCheck<Result>,
    ): NotCheck<NoInfer<Result>> => new NotCheck(check),
  };
}

export type CheckRelationsProxy<Parent extends AnySubject> = {
  [R in keyof Parent["_"]["relations"]]: PermissionCheck<
    Parent["_"]["relations"][R]["_"]["target"]["_"]["name"]
  >;
};
export function createRelationsProxyForAuthCheck<Parent extends AnySubject>(
  parent: Parent,
): CheckRelationsProxy<Parent> {
  return new Proxy<CheckRelationsProxy<Parent>>({} as any, {
    get: (_, prop) => {
      if (typeof prop !== "string" || !parent["relationsMap"].has(prop)) {
        throw new TypeError("Invalid relation");
      }

      return new RelationCheck(parent["relationsMap"].get(prop)!);
    },
  });
}

export type CheckFn<Parent extends AnySubject, Result extends string> = (
  relations: {
    [R in keyof Parent["_"]["relations"]]: PermissionCheck<
      Parent["_"]["relations"][R]["_"]["target"]["_"]["name"]
    >;
  },
  helpers: CheckHelpers,
) => PermissionCheck<Result>;
