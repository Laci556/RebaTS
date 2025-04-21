import type { DatabaseAdapter } from "./src/adapter";
import { initSubjectBuilder } from "./src/entities/subject";
import type { ManySchemaRelation, OneSchemaRelation } from "./src/schema";

const adapter = {
  can: (a: any, b: any) => {
    console.log(a, b);
  },
} as unknown as DatabaseAdapter<{
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
      deletedById: number | null;
      teamId: number;
      parentId: number | null;
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
      parent: OneSchemaRelation<"documents", true>;
    };
  };
}>;

const s = initSubjectBuilder(adapter);

const sUser = s.subject("users").relation(
  "ownedDocuments",
  s.ref("documents", () => sDocument),
  (target) => ({ ownedDocuments: target }),
);
const sDocument = s
  .subject("documents")
  .relation(
    "owner",
    () => sUser,
    (target) => ({ owner: target }),
  )
  .relation(
    "editor",
    () => sUser,
    (target) => ({ editors: target }),
  )
  // .relation(
  //   "parent",
  //   s.ref("documents", () => sDocument),
  //   (target) => ({ parent: { id: target.id } }),
  // )
  .action("delete", (t, { or, not, and }) =>
    or(and(t.editor, not(t.owner)), and(not(t.editor), t.owner)),
  );

adapter.can(
  sUser.select({ id: 1 }),
  sDocument.delete.select({ id: 1, $or: [{ deletedById: null }] }),
);
