import { Controller, Get, Inject } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import {
  initSubjectBuilder,
  RebaTSClient,
  type AuthorizeResult,
  type DatabaseAdapter,
} from "@rebats/core";
import { fromPartial } from "@total-typescript/shoehorn";
import supertest from "supertest";
import type TestAgent from "supertest/lib/agent";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { Authorize, AuthState } from "../src/decorators";
import { REBATS_CLIENT, RebaTSModule } from "../src/module";

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

@Controller()
class TestController {
  constructor(
    @Inject(REBATS_CLIENT) private readonly client: RebaTSClient<any>,
  ) {}

  @Get("/no-auth")
  @Authorize(() => undefined)
  public noAuth() {
    return "authorized";
  }

  @Get("/auth")
  @Authorize((_req, _res, applyAuth) =>
    applyAuth(sUser.select({}), sPost.delete.select({})),
  )
  public auth() {
    return "authorized";
  }

  @Get("/manual-error")
  @Authorize((_req, _res, applyAuth) =>
    applyAuth(sUser.select({}), sPost.delete.select({}), {
      manualErrorHandling: true,
    }),
  )
  public manualError(@AuthState() authState: AuthorizeResult) {
    return authState;
  }

  @Get("/not-found-as-forbidden")
  @Authorize((_req, _res, applyAuth) =>
    applyAuth(sUser.select({}), sPost.delete.select({}), {
      notFoundBehavior: "forbidden",
    }),
  )
  public notFoundAsForbidden() {}

  @Get("/injected-client")
  injectedClient() {
    return this.client.can(sUser.select({}), sPost.delete.select({}));
  }
}

describe("NestJS - integration", () => {
  const adapterMock = { can: vi.fn() };
  let request: TestAgent;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        RebaTSModule.forRoot({
          adapter: fromPartial<DatabaseAdapter<any>>(adapterMock),
        }),
      ],
      controllers: [TestController],
    }).compile();

    const app = moduleFixture.createNestApplication();
    await app.init();
    request = supertest(app.getHttpServer());
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

  test("Should inject client", async () => {
    vi.spyOn(adapterMock, "can").mockResolvedValue({
      success: true,
    });

    const res = await request.get("/injected-client");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });
});
