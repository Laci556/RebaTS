import { RebaTSClient } from "@rebats/core";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, test, vi } from "vitest";
import { createRouteAuthWrapper } from "../src/route-wrapper";
import type { RebaTSRequest } from "../src/utils";

describe("Next route handler", () => {
  const clientMock = new RebaTSClient({} as any);
  const routeHandler = vi.fn(async () => new Response("OK"));

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("Should skip authorization if params are not provided", async () => {
    const routeWrapper = createRouteAuthWrapper(clientMock, {});
    const canSpy = vi.spyOn(clientMock, "can");

    await routeWrapper(
      routeHandler,
      () => undefined,
    )(new NextRequest("http://localhost:1234"));

    expect(routeHandler).toHaveBeenCalled();
    expect(canSpy).not.toHaveBeenCalled();
  });

  test("Should call the route handler if authorization is successful", async () => {
    const routeWrapper = createRouteAuthWrapper(clientMock, {});
    vi.spyOn(clientMock, "can").mockResolvedValue({ success: true });

    await routeWrapper(
      routeHandler,
      () => ({}) as any,
    )(new NextRequest("http://localhost:1234"));

    expect(routeHandler).toHaveBeenCalledWith(
      expect.objectContaining({ authResult: { success: true } }),
    );
  });

  test.each([
    ["unknown", { handleUnknownError: vi.fn() }],
    ["not_found", { handleNotFoundError: vi.fn() }],
    ["forbidden", { handleForbiddenError: vi.fn() }],
  ] as const)(
    "Should call error handler if authorization fails",
    async (errorType, config) => {
      const routeWrapper = createRouteAuthWrapper(clientMock, config);
      vi.spyOn(clientMock, "can").mockResolvedValue({
        success: false,
        error: errorType,
      });

      const req: RebaTSRequest = new NextRequest("http://localhost:1234");
      await routeWrapper(routeHandler, () => ({}) as any)(req);

      expect(routeHandler).not.toHaveBeenCalled();
      expect(Object.values(config)[0]!).toHaveBeenCalledWith(req);
      expect(req.authResult?.error).toEqual(errorType);
    },
  );

  test("Should handle error manually if config is set", async () => {
    const errorHandler = vi.fn();
    const routeWrapper = createRouteAuthWrapper(clientMock, {
      manualErrorHandling: true,
      handleForbiddenError: errorHandler,
    });
    vi.spyOn(clientMock, "can").mockResolvedValue({
      success: false,
      error: "forbidden",
    });

    const req: RebaTSRequest = new NextRequest("http://localhost:1234");
    await routeWrapper(routeHandler, () => ({}) as any)(req);

    expect(errorHandler).not.toHaveBeenCalled();
    expect(routeHandler).toHaveBeenCalledWith(req);
  });

  test("Should return not_found as forbidden if notFoundBehavior is set to forbidden", async () => {
    const errorHandler = vi.fn();
    const routeWrapper = createRouteAuthWrapper(clientMock, {
      notFoundBehavior: "forbidden",
      handleForbiddenError: errorHandler,
    });
    vi.spyOn(clientMock, "can").mockResolvedValue({
      success: false,
      error: "not_found",
    });

    const req: RebaTSRequest = new NextRequest("http://localhost:1234");
    await routeWrapper(routeHandler, () => ({}) as any)(req);

    expect(errorHandler).toHaveBeenCalledWith(req);
  });

  test("Should pass request object to selector", async () => {
    const routeWrapper = createRouteAuthWrapper(clientMock, {});
    vi.spyOn(clientMock, "can").mockResolvedValue({ success: true });

    const req = new NextRequest("http://localhost:1234");

    const selector = vi.fn();
    await routeWrapper(routeHandler, selector)(req);

    expect(selector).toHaveBeenCalledWith(req, expect.anything());
  });
});
