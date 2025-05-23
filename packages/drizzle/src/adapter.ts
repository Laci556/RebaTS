import {
  ActionSelect,
  RelationRef,
  SubjectSelect,
  type AuthorizeResult,
  type DatabaseAdapter,
  type GetTableNames,
  type RebaTSTypeError,
} from "@rebats/core";
import { sql, type AnyRelations } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { AnyDrizzleClient, InferSchemaFromRelations } from "./types";

export class DrizzleAdapter<
  ClientRelations extends AnyRelations,
  InferredSchema extends
    InferSchemaFromRelations<ClientRelations> = InferSchemaFromRelations<ClientRelations>,
> implements DatabaseAdapter<InferredSchema>
{
  declare public readonly _schema: InferredSchema;
  private readonly client: AnyDrizzleClient<ClientRelations>;

  constructor(client: AnyDrizzleClient<ClientRelations>) {
    this.client = client;
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
    const tx = this.client as unknown as NodePgDatabase<
      Record<string, never>,
      AnyRelations
    >;

    try {
      const targetQuery = this.queryToDrizzle(target.query);

      const targetSq = tx
        .$with("target_sq", { exists: sql`1`.as("exists") })
        .as(
          tx.query[target.action.parent.name]!.findFirst({
            where: targetQuery,
            columns: {},
            extras: { exists: sql`1` },
          }) as any,
        );

      const targetSelect = tx
        .select({ exists: targetSq.exists })
        .from(targetSq);

      const relationSq = tx.query[target.action.parent.name]!.findFirst({
        where: {
          AND: [
            targetQuery,
            this.queryToDrizzle(target.action.authCheck.toQuery(who)),
          ] as any,
        },
        columns: {},
        extras: { exists: sql`1` },
      });

      const res = await tx
        .with(targetSq)
        .select({
          targetExists: sql<boolean>`exists ${targetSelect}`.as(
            "target_exists",
          ),
          relationExists:
            sql<boolean>`case when exists ${targetSelect} then exists ${relationSq} else false end`.as(
              "relation_exists",
            ),
        })
        .from(sql`(select 1) as dummy`);

      if (!res[0]) {
        return {
          success: false,
          error: "unknown",
          reason: "No result from query",
        };
      }

      const [{ relationExists, targetExists }] = res;

      if (!targetExists) {
        // Entity not found
        return {
          success: false,
          error: "not_found",
        };
      }

      if (!relationExists) {
        // User not authorized
        return {
          success: false,
          error: "forbidden",
        };
      }

      return { success: true };
    } catch (error) {
      // Error with the drizzle query
      return {
        success: false,
        error: "unknown",
        reason: error,
      };
    }
  }

  private queryToDrizzle(query: any): any {
    if (typeof query === "undefined") return undefined;
    if (typeof query === "object" && query === null) return { isNull: true };
    if (
      typeof query !== "object" ||
      query instanceof Date ||
      Array.isArray(query)
    )
      return query;

    if (query instanceof RelationRef) {
      return this.queryToDrizzle(query.toQuery());
    }

    return Object.entries(query).reduce(
      (acc, [key, value]) => {
        switch (key) {
          // Logical operators
          case "$or":
            acc["OR"] = (value as any[]).map(this.queryToDrizzle.bind(this));
            break;
          case "$and":
            acc["AND"] = (value as any[]).map(this.queryToDrizzle.bind(this));
            break;
          case "$not":
            acc["NOT"] = this.queryToDrizzle(value);
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
            acc[key] = this.queryToDrizzle(value);
            break;
        }

        return acc;
      },
      {} as Record<string, any>,
    );
  }
}

/**
 * Creates a Drizzle adapter for the given client. **Supports only RQB v2 clients!**
 *
 * @param client The Drizzle client to create the adapter for.
 */
export function createAdapter<ClientRelations extends AnyRelations>(
  client: AnyDrizzleClient<ClientRelations>,
): DrizzleAdapter<ClientRelations> {
  return new DrizzleAdapter(client);
}
