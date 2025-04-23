import { initSubjectBuilder, type DatabaseAdapter } from "@rebats/core";
import { fromPartial } from "@total-typescript/shoehorn";
import express from "express";
import supertest from "supertest";
import type TestAgent from "supertest/lib/agent";
import { afterEach, beforeAll, describe, expect, test, vi } from "vitest";
import { authorize, rebatsMiddleware } from "../src/middleware";

const s = initSubjectBuilder({} as DatabaseAdapter<any>);
const sUser = s.subject("user");
const sPost = s
  .subject("post")
  .relation(
    "owner",
    () => sUser,
    (owner) => ({ owner }),
  )
  .action("delete", (post) => post.owner);

describe("Express middleware - integration", () => {
  let adapterMock: DatabaseAdapter<any>;
  let request: TestAgent;

  beforeAll(() => {
    adapterMock = fromPartial({ can: vi.fn() });

    const app = express()
      .use(rebatsMiddleware(adapterMock))
      .get(
        "/no-auth",
        authorize(() => undefined),
        (_, res) => {
          res.send("authorized");
        },
      )
      .get(
        "/auth",
        authorize((_req, _res, applyAuth) =>
          applyAuth(sUser.select({}), sPost.delete.select({})),
        ),
        (_, res) => {
          res.send("authorized");
        },
      )
      .get(
        "/manual-error",
        authorize((_req, _res, applyAuth) =>
          applyAuth(sUser.select({}), sPost.delete.select({}), {
            manualErrorHandling: true,
          }),
        ),
        (_, res) => {
          const { rebats } = res.locals;
          res.send(rebats.result);
        },
      )
      .get(
        "/not-found-as-forbidden",
        authorize((_req, _res, applyAuth) =>
          applyAuth(sUser.select({}), sPost.delete.select({}), {
            notFoundBehavior: "forbidden",
          }),
        ),
      );

    request = supertest(app);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("Should skip authorization", async () => {
    const res = await request.get("/no-auth");

    expect(res.status).toBe(200);
    expect(adapterMock.can).not.toHaveBeenCalled();
  });

  test("Should authorize user", async () => {
    vi.spyOn(adapterMock, "can").mockResolvedValue({ success: true });

    const res = await request.get("/auth");

    expect(res.status).toBe(200);
    expect(res.text).toBe("authorized");
    expect(adapterMock.can).toHaveBeenCalled();
  });

  test.each([
    ["not_found", 404],
    ["forbidden", 403],
    ["unknown", 500],
  ] as const)("Should handle errors", async (error, status) => {
    vi.spyOn(adapterMock, "can").mockResolvedValue({
      success: false,
      error,
    });

    const res = await request.get("/auth");

    expect(res.status).toBe(status);
  });

  test("Should handle errors manually", async () => {
    vi.spyOn(adapterMock, "can").mockResolvedValue({
      success: false,
      error: "forbidden",
    });

    const res = await request.get("/manual-error");

    expect(res.text).toEqual(
      JSON.stringify({
        success: false,
        error: "forbidden",
      }),
    );
  });

  test("Should handle not_found as forbidden", async () => {
    vi.spyOn(adapterMock, "can").mockResolvedValue({
      success: false,
      error: "not_found",
    });

    const res = await request.get("/not-found-as-forbidden");

    expect(res.status).toBe(403);
  });
});
