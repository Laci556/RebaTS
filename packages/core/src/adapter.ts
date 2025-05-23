import type { ActionSelect } from "./entities/action";
import type { SubjectSelect } from "./entities/subject";
import type { CommonSchema, GetTableNames } from "./schema";
import type { RebaTSTypeError } from "./utils";

export type AuthorizationError = "forbidden" | "not_found" | "unknown";
export type AuthorizeResult =
  | { success: true; error?: never }
  | { success: false; error: AuthorizationError; reason?: any };

export interface Authorizable<Schema extends CommonSchema> {
  can<A extends GetTableNames<Schema>, B extends GetTableNames<Schema>>(
    who: SubjectSelect<Schema, A>,
    actionTarget: [A] extends [B]
      ? ActionSelect<Schema, B>
      : RebaTSTypeError<`Incompatible subjects: This action is not defined for subject "${A}"`>,
  ): Promise<AuthorizeResult>;
}

export interface DatabaseAdapter<Schema extends CommonSchema>
  extends Authorizable<Schema> {
  readonly _schema: Schema;
}
