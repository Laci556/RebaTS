import type { AuthorizeResult, CommonSchema, RebaTSClient } from "@rebats/core";

export const NotFoundBehavior = {
  forbidden: "forbidden",
  notFound: "notFound",
} as const;
export type NotFoundBehavior =
  (typeof NotFoundBehavior)[keyof typeof NotFoundBehavior];

export interface RebaTSExpressConfig {
  /**
   * Set it to `true` to handle errors manually in your handler
   * instead of your application's error handler.
   *
   * @note Setting this to `true` will disable `notFoundBehavior`.
   * @default false
   */
  manualErrorHandling?: boolean;

  /**
   * Whether to throw a `not found` or `forbidden` error when the
   * authorized resource is not found. It's useful when you don't want
   * to expose the existence of a resource to the user, e.g. you want
   * to show a generic error page saying `"The requested resource does
   * not exist or you don't have permission to access it"`.
   *
   * @note This option is ignored when `manualErrorHandling` is true.
   * @default "notFound"
   */
  notFoundBehavior?: NotFoundBehavior;
}

export interface RebaTSLocals<Schema extends CommonSchema = CommonSchema> {
  /** The RebaTS client instance. */
  client: RebaTSClient<Schema>;
  result?: AuthorizeResult;
  config?: RebaTSExpressConfig;
}

export class ForbiddenError extends Error {
  public type = "forbidden" as const;
  public name = "ForbiddenError";
  public statusCode = 403;

  constructor() {
    super("Forbidden");
  }
}

export class NotFoundError extends Error {
  public type = "not_found" as const;
  public name = "NotFoundError";
  public statusCode = 404;

  constructor() {
    super("Not Found");
  }
}

export class UnknownAuthorizationError extends Error {
  public type = "unknown" as const;
  public name = "UnknownAuthorizationError";
  public statusCode = 500;

  constructor() {
    super("Unknown authorization error");
  }
}
