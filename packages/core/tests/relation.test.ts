import { fromPartial } from "@total-typescript/shoehorn";
import { describe, test, vi } from "vitest";
import type { DatabaseAdapter } from "../src/adapter";
import { Relation } from "../src/entities/relation";
import { initSubjectBuilder } from "../src/entities/subject";
import { RelationRefPlaceholder } from "../src/query";
import type { ManySchemaRelation, OneSchemaRelation } from "../src/schema";

type SchemaMock = {
  tables: {
    users: {
      id: number;
      email: string;
      teamId: number;
    };
    documents: {
      id: number;
      ownerId: number;
      title: string;
      deletedById: number;
      teamId: number;
    };
  };
  relations: {
    users: {
      ownedDocuments: ManySchemaRelation<"documents">;
      editedDocuments: ManySchemaRelation<"documents">;
      deletedDocuments: ManySchemaRelation<"documents">;
    };
    documents: {
      owner: OneSchemaRelation<"users", false>;
      deletedBy: OneSchemaRelation<"users", true>;
      editors: ManySchemaRelation<"users">;
    };
  };
};

describe("Relation", () => {
  const s = initSubjectBuilder(fromPartial<DatabaseAdapter<SchemaMock>>({}));

  test("Should call connectionFn and wrap it with NestedRelationCheck", () => {
    const sUser = s.subject("users");
    const sDocument = s.subject("documents");
    const connectionFn = vi.fn((user) => ({ owner: user }));
    const relation = new Relation<
      SchemaMock,
      "owner",
      typeof sDocument,
      typeof sUser
    >("owner", sDocument, () => sUser, connectionFn);

    const nestedRelationCheck = relation.connectionFn(
      new RelationRefPlaceholder(),
    );
  });
});
