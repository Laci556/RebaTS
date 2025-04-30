import {
  ConfigurableModuleBuilder,
  Module,
  type ConfigurableModuleAsyncOptions,
  type DynamicModule,
} from "@nestjs/common";
import { initClient, type CommonSchema } from "@rebats/core";
import type { RebaTSModuleOptions } from "./utils";

const {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN: REBATS_MODULE_OPTIONS_TOKEN,
} = new ConfigurableModuleBuilder<RebaTSModuleOptions<any>>()
  .setClassMethodName("forRoot")
  .build();

export { REBATS_MODULE_OPTIONS_TOKEN };

export const REBATS_CLIENT = Symbol("REBATS_CLIENT");

const ClientProvider = {
  provide: REBATS_CLIENT,
  useFactory: (options: RebaTSModuleOptions<any>) => {
    if (!options.adapter) {
      throw new Error(
        "RebaTS module not initialized. Did you forget to call RebaTSModule.forRoot()?",
      );
    }
    return initClient(options.adapter);
  },
  inject: [REBATS_MODULE_OPTIONS_TOKEN],
};

@Module({
  providers: [ClientProvider],
  exports: [REBATS_CLIENT, REBATS_MODULE_OPTIONS_TOKEN],
})
export class RebaTSModule extends ConfigurableModuleClass {
  public static forRoot<Schema extends CommonSchema>(
    options: RebaTSModuleOptions<Schema>,
  ): DynamicModule {
    console.log(super.forRoot(options));
    return {
      global: true,
      ...super.forRoot(options),
    };
  }

  public static forRootAsync<Schema extends CommonSchema>(
    options: ConfigurableModuleAsyncOptions<
      RebaTSModuleOptions<Schema>,
      "create"
    >,
  ): DynamicModule {
    return {
      global: true,
      ...super.forRootAsync(options),
    };
  }
}
