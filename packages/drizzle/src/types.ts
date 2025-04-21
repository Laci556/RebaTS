import type { ManySchemaRelation, OneSchemaRelation } from "@rebats/core";
import type {
  AnyColumn,
  AnyRelations,
  Many,
  One,
  RelationsBuilderConfig,
  Table,
  View,
} from "drizzle-orm";

export interface AnyDrizzleClient<ClientRelations extends AnyRelations> {
  _: { relations: ClientRelations };
}

type ColumnToType<Column extends AnyColumn> =
  | Column["_"]["data"]
  | (true extends Column["_"]["notNull"] ? never : null);

type ExtractTables<TablesConfig extends Record<string, Table | View>> = {
  [TableName in keyof TablesConfig]: TablesConfig[TableName] extends Table
    ? {
        [ColumnName in keyof TablesConfig[TableName]["_"]["columns"]]: ColumnToType<
          TablesConfig[TableName]["_"]["columns"][ColumnName]
        >;
      }
    : never;
};

type ExtractRelations<RelationsConfig extends RelationsBuilderConfig<any>> = {
  [TableName in keyof RelationsConfig]: {
    [RelationName in keyof RelationsConfig[TableName]]: RelationsConfig[TableName][RelationName] extends One<
      any,
      infer ReferencedTable
    >
      ? OneSchemaRelation<ReferencedTable>
      : RelationsConfig[TableName][RelationName] extends Many<
            any,
            infer ReferencedTable
          >
        ? ManySchemaRelation<ReferencedTable>
        : never;
  };
};

export type InferSchemaFromRelations<ClientRelations extends AnyRelations> = {
  tables: ExtractTables<ClientRelations["tables"]>;
  relations: ExtractRelations<ClientRelations["config"]>;
};
