import {
  initClient,
  RebaTSClient,
  type AuthorizationError,
  type CommonSchema,
  type DatabaseAdapter,
  type GetTableNames,
} from "@rebats/core";
import { type RequestHandler } from "express";
import { applyAuth, type AuthSelector } from "./apply-auth";
import {
  ForbiddenError,
  NotFoundError,
  UnknownAuthorizationError,
  type RebaTSExpressConfig,
  type RebaTSLocals,
} from "./types";

declare global {
  namespace Express {
    interface Locals {
      rebats: RebaTSLocals<any>;
    }
  }
}

function getError(type: AuthorizationError, reason?: any) {
  switch (type) {
    case "forbidden":
      return new ForbiddenError(reason);
    case "not_found":
      return new NotFoundError(reason);
    default:
      return new UnknownAuthorizationError(reason);
  }
}

export function rebatsMiddleware(
  clientOrAdapter: RebaTSClient<CommonSchema> | DatabaseAdapter<CommonSchema>,
  config?: RebaTSExpressConfig,
): RequestHandler {
  return (_, res, next) => {
    const client =
      clientOrAdapter instanceof RebaTSClient
        ? clientOrAdapter
        : initClient(clientOrAdapter);
    res.locals.rebats = { client, config };
    next();
  };
}

export function authorize<
  Schema extends CommonSchema,
  A extends GetTableNames<Schema>,
>(selector: AuthSelector<Schema, A>): RequestHandler {
  return async (req, res, next) => {
    if (!res.locals.rebats) {
      return next(
        new Error(
          "RebaTS middleware not initialized. Did you forget to call app.use(rebatsMiddleware())?",
        ),
      );
    }

    try {
      const authParams = await selector(req, res, applyAuth);
      if (!authParams) return next();

      const authResult = await res.locals.rebats.client.can(
        authParams.who,
        authParams.actionTarget,
      );
      res.locals.rebats.result = authResult;

      const config = { ...res.locals.rebats.config, ...authParams.config };

      if (authResult.success || config.manualErrorHandling) return next();

      return next(
        getError(
          authResult.error === "not_found" &&
            config.notFoundBehavior === "forbidden"
            ? "forbidden"
            : authResult.error,
          authResult.reason,
        ),
      );
    } catch (error) {
      next(error);
    }
  };
}
