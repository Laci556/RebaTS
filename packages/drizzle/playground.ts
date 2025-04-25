import { initClient, initSubjectBuilder } from "@rebats/core";
import { defineRelations } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { pgTable, primaryKey } from "drizzle-orm/pg-core";
import { createAdapter } from "./src/adapter";

const users = pgTable("users", ({ serial, text, integer }) => ({
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  teamId: integer("team_id")
    .notNull()
    .references(() => teams.id),
  role: text("role").notNull(),
}));

const documents = pgTable("documents", ({ serial, text, integer }) => ({
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  deletedById: integer("deleted_by").references(() => users.id),
  teamId: integer("team_id")
    .notNull()
    .references(() => teams.id),
}));

const documentEditors = pgTable(
  "document_editors",
  ({ integer }) => ({
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    documentId: integer("document_id")
      .notNull()
      .references(() => documents.id),
  }),
  (t) => [primaryKey({ columns: [t.userId, t.documentId] })],
);

const teams = pgTable("teams", ({ serial, text }) => ({
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
}));

const schema = {
  users,
  documents,
  documentEditors,
  teams,
};

const relations = defineRelations(schema, (r) => ({
  users: {
    ownedDocuments: r.many.documents({ alias: "owner" }),
    editedDocuments: r.many.documents({
      from: r.users.id.through(r.documentEditors.userId),
      to: r.documents.id.through(r.documentEditors.documentId),
    }),
    deletedDocuments: r.many.documents({
      from: r.users.id,
      to: r.documents.deletedById,
      alias: "deleted",
    }),
    team: r.one.teams({
      from: r.users.teamId,
      to: r.teams.id,
    }),
  },
  documents: {
    owner: r.one.users({
      from: r.documents.ownerId,
      to: r.users.id,
      alias: "owner",
    }),
    editors: r.many.users({
      from: r.documents.id.through(r.documentEditors.documentId),
      to: r.users.id.through(r.documentEditors.userId),
    }),
    deletedBy: r.one.users({
      from: r.documents.deletedById,
      to: r.users.id,
      alias: "deletedBy",
    }),
    team: r.one.teams({
      from: r.documents.teamId,
      to: r.teams.id,
    }),
  },
  teams: {
    users: r.many.users(),
    documents: r.many.documents(),
  },
}));

const client = drizzle("postgresql://postgres:root@localhost:5432/authz", {
  relations,
});

const adapter = createAdapter(client);

const s = initSubjectBuilder(adapter);

const sUser = s
  .subject("users")
  .relation(
    "team",
    () => sTeam,
    (team) => ({ team: team }),
  )
  .attribute("role", (role: string) => ({ role }))
  .attribute("idLowerThan", (n: number) => ({ id: { $lt: n } }));
const sTeam = s.subject("teams");
const sDocument = s
  .subject("documents")
  .relation(
    "owner",
    () => sUser,
    (user) => ({
      owner: user.with("role", "admin").with("idLowerThan", 1),
    }),
  )
  .relation(
    "editor",
    () => sUser,
    (user) => ({ editors: user }),
  )
  .relation(
    "team",
    () => sTeam,
    (team) => ({ team: team }),
  )
  .action("delete", (doc) => doc.owner)
  .action("edit", (doc) => doc.owner)
  .action("createComment", (doc) => doc.team);

const authzClient = initClient(adapter);

// client.query.users.findFirst({
//   where: { id: {} },
// });

console.log(
  await authzClient.can(
    sUser.select({ id: 1 }),
    sDocument.edit.select({ id: 1 }),
  ),
);
