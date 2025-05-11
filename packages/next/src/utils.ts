import type { AuthorizeResult } from "@rebats/core";
import { NextRequest } from "next/server";

export const NotFoundBehavior = {
  forbidden: "forbidden",
  notFound: "notFound",
} as const;
export type NotFoundBehavior =
  (typeof NotFoundBehavior)[keyof typeof NotFoundBehavior];

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

/**
 * Configuration for the page authorization wrapper.
 */
export interface PageAuthorizationConfig<P = {}> extends RebaTSAuthConfig {
  /**
   * Component to render when the resource is not found.
   *
   * You can use a custom component:
   *
   * ```tsx
   * function NotFound() {
   *   return <div>Not Found</div>;
   * }
   * ```
   *
   * Or Next's built-in `notFound` error:
   * ```tsx
   * import { notFound } from "next/navigation";
   *
   * function NotFound() {
   *   notFound();
   *   return null;
   * }
   */
  notFoundComponent: React.FC<P>;

  /**
   * Component to render when the user is forbidden to access the resource.
   *
   * You can use a custom component:
   *
   * ```tsx
   * function Forbidden() {
   *   return <div>Forbidden</div>;
   * }
   * ```
   *
   * Or Next's built-in `forbidden` error:
   *
   * ```tsx
   * import { forbidden } from "next/navigation";
   *
   * function NotFound() {
   *   forbidden();
   *   return null;
   * }
   * ```
   * Note that `forbidden` is still experimental, see [the Next.js docs](https://nextjs.org/docs/app/api-reference/functions/forbidden)
   * on how to enable it.
   */
  forbiddenComponent: React.FC<P>;

  /**
   * Component to render when there is an unknown authorization error.
   */
  unknownComponent: React.FC<P>;
}

export interface RebaTSRequest extends NextRequest {
  authResult?: AuthorizeResult;
}

export type WithAuthorizationProps<T = {}> = T & {
  authResult?: AuthorizeResult;
};

/**
 * Configuration for the route authorization wrapper.
 */
export interface RouteAuthorizationConfig extends RebaTSAuthConfig {
  /**
   * Whether to handle errors manually in your handler instead of the
   * configured `handleError` function.
   *
   * @default false
   */
  manualErrorHandling?: boolean;

  /**
   * Allows you to customize the error response when the resource is not found.
   * Note that this option is ignored when `manualErrorHandling` is true.
   *
   * @param request The request object.
   * @returns The response to send back to the client.
   */
  handleNotFoundError?: (request: RebaTSRequest) => Response;

  /**
   * Allows you to customize the error response when the user is forbidden
   * to access the resource.
   * Note that this option is ignored when `manualErrorHandling` is true.
   *
   * @param request The request object.
   * @returns The response to send back to the client.
   */
  handleForbiddenError?: (request: RebaTSRequest) => Response;

  /**
   * Allows you to customize the error response when an unknown error occurs.
   * Note that this option is ignored when `manualErrorHandling` is true.
   *
   * @param request The request object.
   * @returns The response to send back to the client.
   */
  handleUnknownError?: (request: RebaTSRequest) => Response;
}
