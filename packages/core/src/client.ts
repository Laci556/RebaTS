import type { Authorizable, AuthorizeResult, DatabaseAdapter } from "./adapter";
import type { ActionSelect } from "./entities/action";
import type { SubjectSelect } from "./entities/subject";
import type { CommonSchema, GetTableNames } from "./schema";
import type { AuthzTypeError } from "./utils";

type ClientOptions = {};

export class AuthzClient<Schema extends CommonSchema>
  implements Authorizable<Schema>
{
  constructor(
    private readonly adapter: DatabaseAdapter<Schema>,
    private readonly options?: ClientOptions,
  ) {}

  public can<A extends GetTableNames<Schema>, B extends GetTableNames<Schema>>(
    who: SubjectSelect<Schema, A>,
    actionTarget: [A] extends [B]
      ? ActionSelect<Schema, B>
      : AuthzTypeError<`Incompatible subjects: This action is not defined for subject "${A}"`>,
  ): Promise<AuthorizeResult> {
    return this.adapter.can(who, actionTarget);
  }
}

export function initClient<Schema extends CommonSchema>(
  adapter: DatabaseAdapter<Schema>,
  options?: ClientOptions,
) {
  return new AuthzClient(adapter, options);
}
