export type JsonField =
  | string
  | number
  | boolean
  | null
  | JsonField[]
  | { [key: string]: JsonField };

export type FieldValue = string | number | boolean | null | Date | JsonField;

export type OneSchemaRelation<
  Table extends string,
  Nullable extends boolean = boolean,
> = { type: "one"; table: Table; nullable: Nullable };

export type ManySchemaRelation<Table extends string> = {
  type: "many";
  table: Table;
  nullable: false;
};

export type SchemaRelation<Table extends string = string> =
  | OneSchemaRelation<Table>
  | ManySchemaRelation<Table>;

export interface CommonSchema<TableNames extends string = string> {
  tables: Record<TableNames, Record<string, FieldValue>>;
  relations: Record<string, Record<string, SchemaRelation<TableNames>>>;
}

export type GetTableNames<Schema extends CommonSchema> =
  Schema extends CommonSchema<infer TableNames> ? TableNames : never;
