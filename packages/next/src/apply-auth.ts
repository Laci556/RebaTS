import type {
  ActionSelect,
  CommonSchema,
  GetTableNames,
  RebaTSTypeError,
  SubjectSelect,
} from "@rebats/core";

export type AuthParams<
  Config,
  Schema extends CommonSchema,
  A extends GetTableNames<Schema>,
  B extends GetTableNames<Schema>,
> = {
  who: SubjectSelect<Schema, A>;
  actionTarget: ActionSelect<Schema, B>;
  config?: Config;
};

export type MaybePromise<T> = T | Promise<T>;
export type AuthSelector<
  Config,
  Props,
  Schema extends CommonSchema,
  A extends GetTableNames<Schema>,
> = (
  props: Props,
  applyAuth: ApplyAuthFn,
) => MaybePromise<undefined | AuthParams<Config, Schema, A, NoInfer<A>>>;

export function applyAuth<
  Config,
  Schema extends CommonSchema,
  A extends GetTableNames<Schema>,
  B extends GetTableNames<Schema>,
>(
  who: SubjectSelect<Schema, A>,
  actionTarget: [A] extends [B]
    ? ActionSelect<Schema, B>
    : RebaTSTypeError<`Incompatible subjects: This action is not defined for subject "${A}"`>,
  config?: Config,
): AuthParams<Config, Schema, A, B> {
  return { who, actionTarget: actionTarget as ActionSelect<Schema, B>, config };
}
export type ApplyAuthFn = typeof applyAuth;
