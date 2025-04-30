import { ConfigurableModuleBuilder, Global, Module } from "@nestjs/common";
import { initClient } from "@rebats/core";
import type { RebaTSModuleOptions } from "./utils";

const {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN: REBATS_MODULE_OPTIONS_TOKEN,
} = new ConfigurableModuleBuilder<RebaTSModuleOptions>()
  .setClassMethodName("forRoot")
  .build();

export { REBATS_MODULE_OPTIONS_TOKEN };

export const REBATS_CLIENT = Symbol("REBATS_CLIENT");

const ClientProvider = {
  provide: REBATS_CLIENT,
  useFactory: (options: RebaTSModuleOptions) => {
    if (!options.adapter) {
      throw new Error(
        "RebaTS module not initialized. Did you forget to call RebaTSModule.forRoot()?",
      );
    }
    return initClient(options.adapter);
  },
  inject: [REBATS_MODULE_OPTIONS_TOKEN],
};

@Global()
@Module({
  providers: [ClientProvider],
  exports: [REBATS_MODULE_OPTIONS_TOKEN, ClientProvider],
})
export class RebaTSModule extends ConfigurableModuleClass {}
