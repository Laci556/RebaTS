import type { Authorizable, AuthorizeResult, DatabaseAdapter } from "./adapter";
import type { ActionSelect } from "./entities/action";
import type { SubjectSelect } from "./entities/subject";
import type { CommonSchema, GetTableNames } from "./schema";
import type { RebaTSTypeError } from "./utils";

export class RebaTSClient<Schema extends CommonSchema>
  implements Authorizable<Schema>
{
  constructor(private readonly adapter: DatabaseAdapter<Schema>) {}

  public can<A extends GetTableNames<Schema>, B extends GetTableNames<Schema>>(
    who: SubjectSelect<Schema, A>,
    actionTarget: [A] extends [B]
      ? ActionSelect<Schema, B>
      : RebaTSTypeError<`Incompatible subjects: This action is not defined for subject "${A}"`>,
  ): Promise<AuthorizeResult> {
    return this.adapter.can(who, actionTarget);
  }
}

export function initClient<Schema extends CommonSchema>(
  adapter: DatabaseAdapter<Schema>,
) {
  return new RebaTSClient(adapter);
}
