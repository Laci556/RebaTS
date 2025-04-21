import { describe, expect, test } from "bun:test";
import { expectTypeOf } from "expect-type";
import type { DatabaseAdapter } from "../src/adapter";
import { entityType } from "../src/entities/entity-type";
import { Relation } from "../src/entities/relation";
import { initSubjectBuilder, Subject } from "../src/entities/subject";
import type { ManySchemaRelation, OneSchemaRelation } from "../src/schema";

describe("Subject", () => {
  const s = initSubjectBuilder(
    {} as unknown as DatabaseAdapter<{
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
    }>,
  );

  test("Should create a subject", () => {
    const subject = s.subject("users");

    expect(subject).toBeInstanceOf(Subject);
    expect(subject.name).toBe("users");
    expect(subject[entityType]).toBe("subject");
    expectTypeOf<Omit<(typeof subject)["_"], "schema">>().toEqualTypeOf<{
      // TODO: fix schema
      name: "users";
      relations: Record<never, never>;
      actions: Record<never, never>;
    }>();
  });

  test("Should register a relation", () => {
    const sUser = s.subject("users");
    const sDocument = s.subject("documents").relation(
      "owner",
      () => sUser,
      (t) => ({ owner: t }),
    );

    expect(sDocument["relationsMap"].get("owner")).toBeInstanceOf(Relation);
    // TODO: fix type
    // expectTypeOf<(typeof sDocument)["_"]["relations"]>().toEqualTypeOf<{
    //   owner: "users";
    // }>();
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
});
