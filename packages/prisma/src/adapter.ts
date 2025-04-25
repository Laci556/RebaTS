import {
  RelationRef,
  type ActionSelect,
  type AuthorizeResult,
  type DatabaseAdapter,
  type GetTableNames,
  type RebaTSTypeError,
  type SubjectSelect,
} from "@rebats/core";
import type { InferSchemaFromClient } from "./types";

export type PrismaAdapterOptions = {
  /**
   * Whether to run the queries in a transaction.
   *
   * @default true
   */
  useTransaction?: boolean;
};

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

type RuntimeRelationFields = {
  [modelName: string]: {
    [fieldName: string]: {
      type: "many" | "one";
      table: string;
    };
  };
};

type PrismaRuntimeDataModel = {
  models: {
    [modelName: string]: {
      fields: {
        name: string;
        kind: string;
        isList: boolean;
        type: string;
      }[];
    };
  };
};

export class PrismaAdapter<
  TypeMap,
  InferredSchema extends
    InferSchemaFromClient<TypeMap> = InferSchemaFromClient<TypeMap>,
> implements DatabaseAdapter<InferredSchema>
{
  declare public readonly _schema: InferredSchema;
  private readonly options: PrismaAdapterOptions;
  private readonly relationFields: RuntimeRelationFields;

  constructor(
    private readonly client: any,
    options: PrismaAdapterOptions = {},
  ) {
    this.options = {
      useTransaction: options.useTransaction ?? true,
    };

    this.relationFields = Object.entries(
      (client._runtimeDataModel as PrismaRuntimeDataModel).models,
    ).reduce((models, [modelName, model]) => {
      models[modelName] = model.fields.reduce(
        (fields, field) => {
          if (field.kind !== "object") return fields;
          fields[field.name] = {
            type: field.isList ? "many" : "one",
            table: field.type,
          };
          return fields;
        },
        {} as RuntimeRelationFields[string],
      );
      return models;
    }, {} as RuntimeRelationFields);
  }

  private runInTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    if (this.options.useTransaction) {
      return this.client.$transaction((tx: any) => fn(tx));
    }

    return fn(this.client);
  }

  public async can<
    A extends GetTableNames<InferredSchema>,
    B extends GetTableNames<InferredSchema>,
  >(
    who: SubjectSelect<InferredSchema, A>,
    actionTarget: [A] extends [B]
      ? ActionSelect<InferredSchema, B>
      : RebaTSTypeError<`Incompatible subjects: This action is not defined for subject "${A}"`>,
  ): Promise<AuthorizeResult> {
    const target = actionTarget as ActionSelect<InferredSchema, B>;

    try {
      return this.runInTransaction(async (tx) => {
        const targetExists = await tx[target.action.parent.name].findFirst({
          where: this.queryToPrisma(
            target.query,
            capitalize(target.action.parent.name),
          ),
        });

        if (!targetExists) {
          return { success: false, error: "not_found" };
        }

        const relationExists = await tx[target.action.parent.name].findFirst({
          where: this.queryToPrisma(
            {
              $and: [target.query, target.action.authCheck.toQuery(who)],
            },
            capitalize(target.action.parent.name),
          ),
        });

        if (!relationExists) {
          return { success: false, error: "forbidden" };
        }

        return { success: true };
      });
    } catch {
      return {
        success: false,
        error: "unknown",
      };
    }
  }

  private queryToPrisma(query: any, currentModel: string): any {
    if (typeof query === "undefined") return undefined;
    if (typeof query === "object" && query === null) return null;
    if (
      typeof query !== "object" ||
      query instanceof Date ||
      Array.isArray(query)
    )
      return query;

    if (query instanceof RelationRef) {
      return this.queryToPrisma(query.toQuery(), currentModel);
    }

    return Object.entries(query).reduce(
      (acc, [key, value]) => {
        switch (key) {
          // Logical operators
          case "$or":
            acc["OR"] = (value as any[]).map((v) =>
              this.queryToPrisma(v, currentModel),
            );
            break;
          case "$and":
            acc["AND"] = (value as any[]).map((v) =>
              this.queryToPrisma(v, currentModel),
            );
            break;
          case "$not":
            acc["NOT"] = this.queryToPrisma(value, currentModel);
            break;

          // Field comparison operators
          case "$in":
            acc["in"] = value;
            break;
          case "$nin":
            acc["notIn"] = value;
            break;
          case "$lt":
            acc["lt"] = value;
            break;
          case "$lte":
            acc["lte"] = value;
            break;
          case "$gt":
            acc["gt"] = value;
            break;
          case "$gte":
            acc["gte"] = value;
            break;

          default:
            const nextModel =
              this.relationFields[currentModel]?.[key]?.table ?? currentModel;

            if (this.relationFields[currentModel]?.[key]?.type === "many") {
              acc[key] = { some: this.queryToPrisma(value, nextModel) };
            } else {
              acc[key] = this.queryToPrisma(value, nextModel);
            }
            break;
        }

        return acc;
      },
      {} as Record<string, any>,
    );
  }
}

/**
 * Creates a Prisma adapter for the given client.
 *
 * @param client The Prisma client to create the adapter for.
 */
export function createAdapter<TypeMap>(client: any): PrismaAdapter<TypeMap> {
  return new PrismaAdapter<TypeMap>(client);
}
