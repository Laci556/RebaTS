import { fromPartial } from "@total-typescript/shoehorn";
import { describe, expect, test } from "vitest";
import type { DatabaseAdapter } from "../src/adapter";
import { Action, ActionSelect } from "../src/entities/action";
import { entityType } from "../src/entities/entity-type";
import { Relation } from "../src/entities/relation";
import {
  initSubjectBuilder,
  Subject,
  SubjectSelect,
} from "../src/entities/subject";
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

describe("Subject", () => {
  const adapterMock: DatabaseAdapter<SchemaMock> = fromPartial({});
  const s = initSubjectBuilder(adapterMock);

  test("Should create a subject", () => {
    const subject = s.subject("users");

    expect(subject).toBeInstanceOf(Subject);
    expect(subject.name).toBe("users");
    expect(subject[entityType]).toBe("subject");
  });

  test("Should register a relation", () => {
    const sUser = s.subject("users");
    const sDocument = s.subject("documents").relation(
      "owner",
      () => sUser,
      (t) => ({ owner: t }),
    );

    const relation = sDocument["relationsMap"].get("owner")!;
    expect(relation).toBeInstanceOf(Relation);
    expect(relation.name).toBe("owner");
  });

  test("Should create an action", () => {
    const sUser = s.subject("users");
    const sDocument = s
      .subject("documents")
      .relation(
        "owner",
        () => sUser,
        (t) => ({ owner: t }),
      )
      .action("delete", (t) => t.owner);

    const action = sDocument["actionsMap"].get("delete")!;
    expect(action).toBeInstanceOf(Action);
    expect(action.name).toBe("delete");
  });

  test("Should throw TypeError if action does not exist", () => {
    const sUser = s.subject("users");
    const sDocument = s
      .subject("documents")
      .relation(
        "owner",
        () => sUser,
        (t) => ({ owner: t }),
      )
      .action("delete", (t) => t.owner);

    expect(() => {
      // @ts-expect-error
      sDocument.nonExistentAction;
    }).toThrow(
      new TypeError(
        'Action "nonExistentAction" does not exist on subject "documents"',
      ),
    );
  });

  test("Should select a subject for authorization", () => {
    const sUser = s.subject("users");

    const selected = sUser.select({ id: 1 });

    expect(selected).toBeInstanceOf(SubjectSelect);
  });

  test("Should select an action for authorization", () => {
    const sUser = s.subject("users");
    const sDocument = s
      .subject("documents")
      .relation(
        "owner",
        () => sUser,
        (t) => ({ owner: t }),
      )
      .action("delete", (t) => t.owner);

    const selected = sDocument.delete.select({ id: 1 });

    expect(selected).toBeInstanceOf(ActionSelect);
  });
});
