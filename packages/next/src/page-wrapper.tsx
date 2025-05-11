import type {
  AuthorizeResult,
  CommonSchema,
  GetTableNames,
  RebaTSClient,
} from "@rebats/core";
import type { FC, JSX } from "react";
import { applyAuth, type AuthSelector } from "./apply-auth";
import type { PageAuthorizationConfig } from "./utils";

export function createPageAuthWrapper<Schema extends CommonSchema>(
  client: RebaTSClient<Schema>,
  globalConfig: PageAuthorizationConfig,
) {
  return function <A extends GetTableNames<Schema>, P = {}>(
    Component: FC<P & { authResult?: AuthorizeResult }>,
    selector: AuthSelector<Partial<PageAuthorizationConfig<P>>, P, Schema, A>,
  ): FC<P> {
    const AuthorizedComponent: FC<P> = async (props) => {
      const authParams = await selector(props, applyAuth);
      if (!authParams) {
        return <Component {...(props as P & JSX.IntrinsicAttributes)} />;
      }

      const authResult = await client.can(
        authParams.who,
        authParams.actionTarget,
      );
      const newProps = { ...props, authResult };

      const config = { ...globalConfig, ...authParams.config };

      if (authResult.success || config.manualErrorHandling) {
        return <Component {...newProps} />;
      }

      if (authResult.error === "unknown") {
        return <config.unknownComponent {...newProps} />;
      }

      if (
        authResult.error === "not_found" &&
        config.notFoundBehavior !== "forbidden"
      ) {
        return <config.notFoundComponent {...newProps} />;
      }

      return <config.forbiddenComponent {...newProps} />;
    };
    AuthorizedComponent.displayName = `withAuthorization(${Component.displayName || Component.name})`;
    return AuthorizedComponent;
  };
}
