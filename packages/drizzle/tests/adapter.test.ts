import type { ManySchemaRelation, OneSchemaRelation } from "@rebats/core";
import { describe, test } from "bun:test";
import { defineRelations } from "drizzle-orm";
import { pgTable } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/pglite";
import { expectTypeOf } from "expect-type";
import { createAdapter } from "../src/adapter";

describe("DrizzleAdapter", () => {
  test("Should convert client relations to schema", () => {
    const users = pgTable("users", ({ serial, text }) => ({
      id: serial("id").primaryKey(),
      email: text("email").notNull().unique(),
    }));
    const documents = pgTable("documents", ({ serial, text, integer }) => ({
      id: serial("id").primaryKey(),
      ownerId: integer("owner_id")
        .notNull()
        .references(() => users.id),
      title: text("title").notNull(),
      deletedById: integer("deleted_by").references(() => users.id),
    }));

    const relations = defineRelations({ users, documents }, (r) => ({
      users: {
        deletedDocuments: r.many.documents({ alias: "deletedBy" }),
        ownedDocuments: r.many.documents({ alias: "owner" }),
      },
      documents: {
        owner: r.one.users({
          from: r.documents.ownerId,
          to: r.users.id,
          alias: "owner",
        }),
        deletedBy: r.one.users({
          from: r.documents.deletedById,
          to: r.users.id,
          alias: "deletedBy",
        }),
      },
    }));

    const client = drizzle.mock({ relations });
    const adapter = createAdapter(client);

    expectTypeOf(adapter._schema).toMatchObjectType<{
      tables: {
        users: { id: number; email: string };
        documents: {
          id: number;
          ownerId: number;
          title: string;
          deletedById: number | null;
        };
      };
      relations: {
        users: {
          ownedDocuments: ManySchemaRelation<"documents">;
          deletedDocuments: ManySchemaRelation<"documents">;
        };
        documents: {
          owner: OneSchemaRelation<"users">;
          deletedBy: OneSchemaRelation<"users">;
        };
      };
    }>();
  });
});
