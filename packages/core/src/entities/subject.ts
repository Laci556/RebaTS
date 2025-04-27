import type { DatabaseAdapter } from "../adapter";
import type { SelectQuery } from "../query";
import type { CommonSchema, GetTableNames } from "../schema";
import { Action, type AnyAction } from "./action";
import { entityType } from "./entity-type";
import type { CheckFn } from "./permission-check";
import {
  Relation,
  type AnyRelation,
  type RelationConnectionFn,
} from "./relation";

export type AnySubject<
  Schema extends CommonSchema = any,
  Name extends GetTableNames<Schema> = any,
  Relations extends Record<string, AnyRelation> = any,
  Actions extends Record<string, AnyAction> = any,
  Attributes extends Record<string, any> = any,
> = Subject<Schema, Name, Relations, Actions, Attributes>;

export class Subject<
  Schema extends CommonSchema,
  Name extends GetTableNames<Schema>,
  Relations extends Record<string, AnyRelation> = Record<never, never>,
  Actions extends Record<string, AnyAction> = Record<never, never>,
  Attributes extends Record<string, any> = Record<never, never>,
> {
  /**
   * Contains type information about the entity.
   * DO NOT USE THIS IN RUNTIME!
   * @internal
   */
  declare readonly _: {
    schema: Schema;
    name: Name;
    relations: Relations;
    actions: Actions;
    attributes: Attributes;
  };

  public readonly [entityType] = "subject";
  public readonly name: Name;

  private relationsMap: Map<string, AnyRelation> = new Map();
  private actionsMap: Map<string, AnyAction> = new Map();
  private attributesMap: Map<string, (...args: any[]) => any> = new Map();

  constructor(name: Name) {
    this.name = name;
    return new Proxy(this, {
      get: (target, prop, receiver) => {
        if (prop in target) {
          return Reflect.get(target, prop, receiver);
        }

        if (typeof prop === "string" && this.actionsMap.has(prop)) {
          return this.actionsMap.get(prop);
        }

        throw new TypeError(
          `Action "${String(prop)}" does not exist on subject "${target.name}"`,
        );
      },
    });
  }

  public relation<
    RelationName extends string,
    TargetSubject extends AnySubject,
  >(
    relationName: RelationName,
    reference: () => TargetSubject,
    connection: RelationConnectionFn<
      Schema,
      Subject<Schema, Name, Relations>,
      TargetSubject
    >,
  ): SubjectWithActions<
    Schema,
    Name,
    {
      [Key in keyof Relations | RelationName]: Key extends RelationName
        ? Relation<
            Schema,
            RelationName,
            Subject<Schema, Name, Relations, Actions, Attributes>,
            TargetSubject
          >
        : Relations[Key];
    },
    Actions,
    Attributes
  > {
    this.relationsMap.set(
      relationName,
      new Relation(relationName, this as any, reference, connection),
    );
    return this as any;
  }

  public action<
    ActionName extends string,
    ResultName extends GetTableNames<Schema>,
  >(
    actionName: ActionName,
    checkFn: CheckFn<
      Subject<Schema, Name, Relations, Actions, Attributes>,
      ResultName
    >,
  ): SubjectWithActions<
    Schema,
    Name,
    Relations,
    {
      [Key in keyof Actions | ActionName]: Key extends ActionName
        ? Action<
            Schema,
            ActionName,
            Subject<Schema, Name, Relations, Actions, Attributes>,
            ResultName
          >
        : Actions[Key];
    },
    Attributes
  > {
    this.actionsMap.set(
      actionName,
      new Action(actionName, this as any, checkFn),
    );
    return this as any;
  }

  public attribute<AttributeName extends string>(
    attributeName: AttributeName,
    checkFn: () => SelectQuery<Schema, Name>,
  ): SubjectWithActions<
    Schema,
    Name,
    Relations,
    Actions,
    {
      [Key in keyof Attributes | AttributeName]: Key extends AttributeName
        ? never
        : Attributes[Key];
    }
  >;
  public attribute<AttributeName extends string, Arg extends any>(
    attributeName: AttributeName,
    checkFn: (arg: Arg) => SelectQuery<Schema, Name>,
  ): SubjectWithActions<
    Schema,
    Name,
    Relations,
    Actions,
    {
      [Key in keyof Attributes | AttributeName]: Key extends AttributeName
        ? Arg
        : Attributes[Key];
    }
  >;
  public attribute<AttributeName extends string, Arg extends any>(
    attributeName: AttributeName,
    checkFn: (arg: Arg) => SelectQuery<Schema, Name>,
  ) {
    this.attributesMap.set(attributeName, checkFn);
    return this as any;
  }

  public select(query: SelectQuery<Schema, Name>): SubjectSelect<Schema, Name> {
    return new SubjectSelect(this as any, query);
  }
}

export class SubjectSelect<
  Schema extends CommonSchema,
  OutputSubjectName extends GetTableNames<Schema>,
> {
  public readonly [entityType] = "subjectSelect";
  public readonly outputSubject: AnySubject<Schema, OutputSubjectName>;
  public readonly query: SelectQuery<Schema, OutputSubjectName>;
  declare readonly _: {
    output: OutputSubjectName;
  };

  constructor(
    outputSubject: Subject<Schema, OutputSubjectName>,
    query: SelectQuery<Schema, OutputSubjectName>,
  ) {
    this.outputSubject = outputSubject;
    this.query = query;
  }
}

type SubjectWithActions<
  Schema extends CommonSchema,
  Name extends GetTableNames<Schema>,
  Relations extends Record<string, AnyRelation> = Record<never, never>,
  Actions extends Record<string, AnyAction> = Record<never, never>,
  Attributes extends Record<string, any> = Record<never, never>,
> = Subject<Schema, Name, Relations, Actions, Attributes> & {
  [Key in keyof Actions]: Actions[Key];
};

class SubjectBuilder<Schema extends CommonSchema> {
  public subject<Name extends GetTableNames<Schema>>(
    name: Name,
  ): SubjectWithActions<Schema, Name> {
    return new Subject(name);
  }

  public ref<Name extends GetTableNames<Schema>>(
    name: Name,
    ref: () => any,
  ): () => AnySubject<CommonSchema, Name>;
  public ref<Name extends GetTableNames<Schema>>(
    ref: () => any,
  ): () => AnySubject<CommonSchema, Name>;
  public ref<Name extends GetTableNames<Schema>>(
    ...args: [Name, () => any] | [() => any]
  ): () => AnySubject<CommonSchema, Name> {
    return args[args.length - 1] as any;
  }
}

export function initSubjectBuilder<Schema extends CommonSchema>(
  _adapter: DatabaseAdapter<Schema>,
): SubjectBuilder<Schema> {
  return new SubjectBuilder<Schema>();
}
