import {
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import type { CommonSchema, DatabaseAdapter } from "@rebats/core";

export const NotFoundBehavior = {
  forbidden: "forbidden",
  notFound: "notFound",
} as const;
export type NotFoundBehavior =
  (typeof NotFoundBehavior)[keyof typeof NotFoundBehavior];

export const GUARD_METADATA_KEY = Symbol("GUARD_METADATA_KEY");
export const AUTH_RESULT_KEY = Symbol("AUTH_RESULT_KEY");

export interface RebaTSAuthConfig {
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

export interface RebaTSModuleOptions<Schema extends CommonSchema>
  extends RebaTSAuthConfig {
  adapter: DatabaseAdapter<Schema>;
}

export class RebaTSForbiddenException extends ForbiddenException {}
export class RebaTSNotFoundException extends NotFoundException {}
export class RebaTSUnknownException extends InternalServerErrorException {}
