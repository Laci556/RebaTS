import {
  applyDecorators,
  createParamDecorator,
  SetMetadata,
  UseGuards,
} from "@nestjs/common";
import type { CommonSchema, GetTableNames } from "@rebats/core";
import type { AuthSelector } from "./apply-auth";
import { RebaTSGuard } from "./guard";
import { AUTH_RESULT_KEY, GUARD_METADATA_KEY } from "./utils";

export const Authorize = <
  Schema extends CommonSchema,
  A extends GetTableNames<Schema>,
  Req = unknown,
  Res = unknown,
>(
  selector: AuthSelector<Schema, A, Req, Res>,
): MethodDecorator =>
  applyDecorators(
    SetMetadata(GUARD_METADATA_KEY, selector),
    UseGuards(RebaTSGuard),
  );

export const AuthState: () => ParameterDecorator = createParamDecorator(
  (_, ctx) => {
    if (ctx.getType() !== "http") {
      throw new Error("RebaTS currently only supports HTTP context");
    }
    const req = ctx.switchToHttp().getRequest();
    return req[AUTH_RESULT_KEY];
  },
);
