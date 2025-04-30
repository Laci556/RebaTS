import type {
  ActionSelect,
  CommonSchema,
  GetTableNames,
  RebaTSTypeError,
  SubjectSelect,
} from "@rebats/core";
import type { RebaTSAuthConfig } from "./utils";

export type AuthParams<
  Schema extends CommonSchema,
  A extends GetTableNames<Schema>,
  B extends GetTableNames<Schema>,
> = {
  who: SubjectSelect<Schema, A>;
  actionTarget: ActionSelect<Schema, B>;
  config?: RebaTSAuthConfig;
};

type MaybePromise<T> = T | Promise<T>;
export type AuthSelector<
  Schema extends CommonSchema,
  A extends GetTableNames<Schema>,
  Req,
  Res,
> = (
  req: Req,
  res: Res,
  applyAuth: ApplyAuthFn,
) => MaybePromise<undefined | AuthParams<Schema, A, NoInfer<A>>>;

export function applyAuth<
  Schema extends CommonSchema,
  A extends GetTableNames<Schema>,
  B extends GetTableNames<Schema>,
>(
  who: SubjectSelect<Schema, A>,
  actionTarget: [A] extends [B]
    ? ActionSelect<Schema, B>
    : RebaTSTypeError<`Incompatible subjects: This action is not defined for subject "${A}"`>,
  config?: RebaTSAuthConfig,
): AuthParams<Schema, A, B> {
  return { who, actionTarget: actionTarget as ActionSelect<Schema, B>, config };
}
export type ApplyAuthFn = typeof applyAuth;
