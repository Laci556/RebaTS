import type {
  ActionSelect,
  CommonSchema,
  GetTableNames,
  RebaTSTypeError,
  SubjectSelect,
} from "@rebats/core";
import type { Request, Response } from "express";
import type { RebaTSExpressConfig } from "./types";

export type AuthParams<
  Schema extends CommonSchema,
  A extends GetTableNames<Schema>,
  B extends GetTableNames<Schema>,
> = {
  who: SubjectSelect<Schema, A>;
  actionTarget: ActionSelect<Schema, B>;
  config?: RebaTSExpressConfig;
};

type MaybePromise<T> = T | Promise<T>;
export type AuthSelector<
  Schema extends CommonSchema,
  A extends GetTableNames<Schema>,
> = (
  req: Request,
  res: Response,
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
  config?: RebaTSExpressConfig,
): AuthParams<Schema, A, B> {
  return { who, actionTarget: actionTarget as ActionSelect<Schema, B>, config };
}
export type ApplyAuthFn = typeof applyAuth;
