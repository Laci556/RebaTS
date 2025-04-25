import type { AnySubject } from "./entities/subject";
import type { CommonSchema, GetTableNames, SchemaRelation } from "./schema";

export const queryRef: unique symbol = Symbol("queryRef");
export const queryOperator: unique symbol = Symbol("queryOperator");

interface InternalFieldFilters<T> {
  $lt?: T | undefined;
  $lte?: T | undefined;
  $gt?: T | undefined;
  $gte?: T | undefined;
  $in?: T[] | undefined;
  $nin?: T[] | undefined;
}

type FieldFilter<T> = T | InternalFieldFilters<T>;

export class RelationRefPlaceholder<
  Table extends string,
  Attributes extends Record<string, any>,
> {
  protected readonly appliedAttributes: Array<[string, any]> = [];

  public with<AttributeName extends keyof Attributes>(
    attributeName: AttributeName,
    ...args: Attributes[AttributeName] extends never
      ? []
      : [Attributes[AttributeName]]
  ): RelationRefPlaceholder<Table, Attributes> {
    this.appliedAttributes.push([attributeName as string, args[0]]);
    return this;
  }
}

export class RelationRef<
  Table extends string,
  Attributes extends Record<string, any>,
> extends RelationRefPlaceholder<Table, Attributes> {
  private readonly subject: AnySubject;
  private readonly query: any;

  constructor(subject: AnySubject, query: any) {
    super();
    this.subject = subject;
    this.query = query;
  }

  public toQuery(): any {
    if (!this.appliedAttributes.length) return this.query;
    return {
      $and: [
        this.query,
        ...this.appliedAttributes.map(([attributeName, arg]) => {
          const attributeFn = this.subject["attributesMap"].get(attributeName);
          if (!attributeFn) {
            throw new Error(
              `Attribute "${attributeName}" not found on subject "${this.subject.name}"`,
            );
          }
          return attributeFn(arg);
        }),
      ],
    };
  }
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
                  ? RelationRefPlaceholder<TargetTableName, any>
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
