import type { CommonSchema, GetTableNames, SchemaRelation } from "./schema";

export const queryRef: unique symbol = Symbol("queryRef");
export const queryOperator: unique symbol = Symbol("queryOperator");

interface InternalFieldFilters<T> {
  // TODO: add more operators
}

type FieldFilter<T> = T | InternalFieldFilters<T>;

export class RelationRefPlaceholder<Table extends string> {
  constructor(public readonly table: Table) {}
}

export type SchemaQuery<
  Schema extends CommonSchema,
  TableName extends GetTableNames<Schema>,
  TargetTableName extends GetTableNames<Schema>,
> = {
  [Field in
    | "$and"
    | "$or"
    | "$not"
    | keyof Schema["tables"][TableName]
    | keyof Schema["relations"][TableName]]?: Field extends "$and" | "$or"
    ? SchemaQuery<Schema, TableName, TargetTableName>[]
    : Field extends "$not"
      ? SchemaQuery<Schema, TableName, TargetTableName>
      : Field extends keyof Schema["tables"][TableName]
        ? FieldFilter<Schema["tables"][TableName][Field]>
        : Schema["relations"][TableName][Field] extends SchemaRelation<
              infer RelatedTable extends GetTableNames<Schema>
            >
          ?
              | (RelatedTable extends TargetTableName
                  ? RelationRefPlaceholder<TargetTableName>
                  : never)
              | SchemaQuery<Schema, RelatedTable, TargetTableName>
          : never;
};

export type SelectQuery<
  Schema extends CommonSchema,
  TableName extends GetTableNames<Schema>,
> = {
  [Field in
    | "$and"
    | "$or"
    | "$not"
    | keyof Schema["tables"][TableName]
    | keyof Schema["relations"][TableName]]?: Field extends "$and" | "$or"
    ? SelectQuery<Schema, TableName>[]
    : "$not" extends Field
      ? SelectQuery<Schema, TableName>
      : Field extends keyof Schema["tables"][TableName]
        ? FieldFilter<Schema["tables"][TableName][Field]>
        : Schema["relations"][TableName][Field] extends SchemaRelation<
              infer RelatedTable extends GetTableNames<Schema>
            >
          ? SelectQuery<Schema, RelatedTable>
          : never;
};
