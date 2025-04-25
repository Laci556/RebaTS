import { bench } from "@ark/attest";
import type { DatabaseAdapter } from "../src/adapter";
import { initSubjectBuilder } from "../src/entities/subject";
import type { ManySchemaRelation, OneSchemaRelation } from "../src/schema";

const adapter = {} as unknown as DatabaseAdapter<{
  tables: {
    users: {
      id: number;
      email: string;
      teamId: number;
      role: string;
    };
    documents: {
      id: number;
      ownerId: number;
      title: string;
      deletedById: number;
      teamId: number;
      parentId: number;
    };
    teams: {
      id: number;
    };
  };
  relations: {
    users: {
      ownedDocuments: ManySchemaRelation<"documents">;
      editedDocuments: ManySchemaRelation<"documents">;
      deletedDocuments: ManySchemaRelation<"documents">;
      team: OneSchemaRelation<"teams", true>;
    };
    documents: {
      owner: OneSchemaRelation<"users", false>;
      deletedBy: OneSchemaRelation<"users", true>;
      editors: ManySchemaRelation<"users">;
      parent: OneSchemaRelation<"documents", true>;
    };
    teams: {
      users: ManySchemaRelation<"users">;
    };
  };
}>;

const s = initSubjectBuilder(adapter);

bench("Initialize single subject", () => {
  const sUser = s.subject("users");
}).types([156, "instantiations"]);

bench("Initialize 2 subjects", () => {
  const sUser = s.subject("users");
  const sDocument = s.subject("documents");
}).types([166, "instantiations"]);

bench("Circular reference with ref", () => {
  const sUser = s.subject("users");
  const sDocument = s.subject("documents").relation(
    "parent",
    s.ref("documents", () => sDocument),
    (target) => ({ parent: target }),
  );
}).types([547, "instantiations"]);

bench("Add a single relation between 2 subjects", () => {
  const sUser = s.subject("users");
  const sDocument = s.subject("documents").relation(
    "owner",
    () => sUser,
    (target) => ({ owner: target }),
  );
}).types([486, "instantiations"]);

bench("2 relations on same subject", () => {
  const sUser = s.subject("users");
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
    );
}).types([814, "instantiations"]);

bench("3 relations on same subject", () => {
  const sUser = s.subject("users");
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
    .relation(
      "deletor",
      () => sUser,
      (target) => ({ deletedBy: target }),
    );
}).types([1105, "instantiations"]);

bench("3 relations on same subject that has a relation", () => {
  const sTeam = s.subject("teams");
  const sUser = s.subject("users").relation(
    "team",
    () => sTeam,
    (target) => ({ team: target }),
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
    .relation(
      "deletor",
      () => sUser,
      (target) => ({ deletedBy: target }),
    );
}).types([1628, "instantiations"]);

bench("Simple action", () => {
  const sUser = s.subject("users");
  const sDocument = s
    .subject("documents")
    .relation(
      "owner",
      () => sUser,
      (target) => ({ owner: target }),
    )
    .action("edit", (relations) => relations.owner);
}).types([713, "instantiations"]);

bench("2 simple actions", () => {
  const sUser = s.subject("users");
  const sDocument = s
    .subject("documents")
    .relation(
      "owner",
      () => sUser,
      (target) => ({ owner: target }),
    )
    .action("edit", (relations) => relations.owner)
    .action("delete", (relations) => relations.owner);
}).types([991, "instantiations"]);

bench("Complex action", () => {
  const sUser = s.subject("users");
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
    .action("edit", (relations, { and, not, or }) =>
      or(
        and(relations.owner, not(relations.editor)),
        and(not(relations.owner), relations.editor),
      ),
    );
}).types([1231, "instantiations"]);
