import type { CommonSchema, GetTableNames, RebaTSClient } from "@rebats/core";
import { NextRequest, NextResponse } from "next/server";
import { applyAuth, type AuthSelector, type MaybePromise } from "./apply-auth";
import type { RebaTSRequest, RouteAuthorizationConfig } from "./utils";

export function createRouteAuthWrapper<Schema extends CommonSchema>(
  client: RebaTSClient<Schema>,
  globalConfig: RouteAuthorizationConfig,
) {
  return function <A extends GetTableNames<Schema>>(
    route: (request: RebaTSRequest) => MaybePromise<Response>,
    selector: AuthSelector<RouteAuthorizationConfig, NextRequest, Schema, A>,
  ): (request: NextRequest) => Promise<Response> {
    return async (request: NextRequest) => {
      const authParams = await selector(request, applyAuth);
      if (!authParams) return route(request);

      const authResult = await client.can(
        authParams.who,
        authParams.actionTarget,
      );
      (request as RebaTSRequest).authResult = authResult;

      const config = { ...globalConfig, ...authParams.config };

      if (authResult.success || config.manualErrorHandling) {
        return route(request);
      }

      if (authResult.error === "unknown") {
        return config.handleUnknownError
          ? config.handleUnknownError(request)
          : new NextResponse(null, { status: 500 });
      }

      if (
        authResult.error === "not_found" &&
        config.notFoundBehavior !== "forbidden"
      ) {
        return config.handleNotFoundError
          ? config.handleNotFoundError(request)
          : new NextResponse(null, { status: 404 });
      }

      return config.handleForbiddenError
        ? config.handleForbiddenError(request)
        : new NextResponse(null, { status: 403 });
    };
  };
}
