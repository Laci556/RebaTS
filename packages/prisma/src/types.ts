export type InferSchemaFromClient<TypeMap> = TypeMap extends {
  model: infer ModelMap extends Record<
    string,
    { payload: { scalars: any; objects: any } }
  >;
}
  ? {
      tables: {
        [Model in keyof ModelMap as Model extends string
          ? Uncapitalize<Model>
          : never]: TypeMap["model"][Model]["payload"]["scalars"];
      };
      relations: {
        [Model in keyof ModelMap as Model extends string
          ? Uncapitalize<Model>
          : never]: TypeMap["model"][Model]["payload"]["objects"] extends infer Objects
          ? {
              [Relation in keyof Objects]: {
                type: Objects[Relation] extends Array<any> ? "many" : "one";
                nullable: null extends Objects[Relation] ? true : false;
                table: Objects[Relation] extends Array<{
                  name: infer ReferencedModel extends string;
                }>
                  ? Uncapitalize<ReferencedModel>
                  : Objects[Relation] extends {
                        name: infer ReferencedModel extends string;
                      } | null
                    ? Uncapitalize<ReferencedModel>
                    : never;
              };
            }
          : never;
      };
    }
  : never;
