import {
  initClient,
  type AuthorizeResult,
  type CommonSchema,
  type DatabaseAdapter,
  type GetTableNames,
} from "@rebats/core";
import type { NextRequest } from "next/server";
import type { FC } from "react";
import type { AuthSelector, MaybePromise } from "./apply-auth";
import { createPageAuthWrapper } from "./page-wrapper";
import { createRouteAuthWrapper } from "./route-wrapper";
import type {
  PageAuthorizationConfig,
  RebaTSRequest,
  RouteAuthorizationConfig,
} from "./utils";

interface RebaTSHandlers<Schema extends CommonSchema> {
  protectedPage: <A extends GetTableNames<Schema>, P = {}>(
    Component: FC<P & { authResult?: AuthorizeResult }>,
    selector: AuthSelector<Partial<PageAuthorizationConfig<P>>, P, Schema, A>,
  ) => FC<P>;
  protectedRoute: <A extends GetTableNames<Schema>>(
    route: (request: RebaTSRequest) => MaybePromise<Response>,
    selector: AuthSelector<RouteAuthorizationConfig, NextRequest, Schema, A>,
  ) => (request: NextRequest) => Promise<Response>;
}

export function initRebaTS<Schema extends CommonSchema>(
  adapter: DatabaseAdapter<Schema>,
  config: PageAuthorizationConfig & RouteAuthorizationConfig,
): RebaTSHandlers<Schema> {
  const client = initClient(adapter);
  return {
    protectedPage: createPageAuthWrapper<Schema>(client, config),
    protectedRoute: createRouteAuthWrapper<Schema>(client, config),
  };
}
