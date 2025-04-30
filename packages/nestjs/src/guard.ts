import {
  Inject,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { AuthorizationError, RebaTSClient } from "@rebats/core";
import { applyAuth, type AuthSelector } from "./apply-auth";
import { REBATS_CLIENT, REBATS_MODULE_OPTIONS_TOKEN } from "./module";
import {
  AUTH_RESULT_KEY,
  GUARD_METADATA_KEY,
  RebaTSForbiddenException,
  RebaTSNotFoundException,
  RebaTSUnknownException,
  type RebaTSModuleOptions,
} from "./utils";

@Injectable()
export class RebaTSGuard implements CanActivate {
  constructor(
    @Inject(REBATS_MODULE_OPTIONS_TOKEN)
    private readonly options: RebaTSModuleOptions<any>,
    @Inject(REBATS_CLIENT)
    private readonly client: RebaTSClient<any>,
    private readonly reflector: Reflector,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const selector = this.reflector.get<AuthSelector<any, any, any, any>>(
      GUARD_METADATA_KEY,
      context.getHandler(),
    );

    if (!selector) return true;
    if (context.getType() !== "http") {
      throw new Error("RebaTS currently only supports HTTP context");
    }

    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const authParams = await selector(req, res, applyAuth);
    if (!authParams) return true;

    const { who, actionTarget } = authParams;
    const { adapter, ...globalConfig } = this.options;
    const config = { ...globalConfig, ...authParams.config };

    const authResult = await this.client.can(who, actionTarget);
    req[AUTH_RESULT_KEY] = authResult;

    if (authResult.success || config.manualErrorHandling) return true;

    throw this.getError(
      authResult.error === "not_found" &&
        config.notFoundBehavior === "forbidden"
        ? "forbidden"
        : authResult.error,
    );
  }

  private getError(type: AuthorizationError) {
    switch (type) {
      case "forbidden":
        return new RebaTSForbiddenException();
      case "not_found":
        return new RebaTSNotFoundException();
      case "unknown":
        return new RebaTSUnknownException();
    }
  }
}
