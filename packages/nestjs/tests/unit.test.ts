import type { ExecutionContext } from "@nestjs/common";
import { fromAny, fromPartial } from "@total-typescript/shoehorn";
import { afterEach, describe, expect, test, vi } from "vitest";
import { applyAuth, type AuthSelector } from "../src/apply-auth";
import { RebaTSGuard } from "../src/guard";
import {
  AUTH_RESULT_KEY,
  RebaTSForbiddenException,
  RebaTSNotFoundException,
  RebaTSUnknownException,
  type RebaTSModuleOptions,
} from "../src/utils";

const errorMap = {
  forbidden: RebaTSForbiddenException,
  not_found: RebaTSNotFoundException,
  unknown: RebaTSUnknownException,
};

describe("Authorize", () => {
  const callGuard = ({
    options = fromPartial({}),
    metadata,
    context = fromPartial({
      switchToHttp: () =>
        fromPartial({
          getRequest: vi.fn(() => ({})),
          getResponse: vi.fn(() => ({})),
        }),
    }),
  }: Partial<{
    options: RebaTSModuleOptions;
    metadata: AuthSelector<any, any, any, any>;
    context: ExecutionContext;
  }>) => {
    return new RebaTSGuard(
      options!,
      fromPartial(options?.adapter!),
      fromPartial({ get: () => metadata }),
    ).canActivate(
      fromPartial({
        getType: () => "http",
        getHandler: () => vi.fn(),
        ...context,
      }),
    );
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("Should return true when selector is not set", async () => {
    const result = callGuard({ metadata: undefined });

    await expect(result).resolves.toBe(true);
  });

  test("Should throw if context is not HTTP", async () => {
    const result = callGuard({
      metadata: () => undefined,
      context: fromPartial({ getType: () => "ws" }),
    });

    await expect(result).rejects.toThrow(
      "RebaTS currently only supports HTTP context",
    );
  });

  test("Should return true if authParams is undefined", async () => {
    const selectorMock = vi.fn(() => undefined);
    const result = callGuard({
      metadata: selectorMock,
    });

    await expect(result).resolves.toBe(true);
    expect(selectorMock).toHaveBeenCalled();
  });

  test("Should pass request and response to selector", async () => {
    const selectorMock = vi.fn(() => undefined);
    const requestMock = {};
    const responseMock = {};

    await callGuard({
      metadata: selectorMock,
      context: fromPartial({
        switchToHttp: () => ({
          getRequest: () => requestMock,
          getResponse: () => responseMock,
        }),
      }),
    });

    expect(selectorMock).toHaveBeenCalledWith(
      requestMock,
      responseMock,
      applyAuth,
    );
  });

  test("Should call adapter.can with authParams", async () => {
    const adapterMock = {
      can: vi.fn(() => ({ success: true })),
    };

    await callGuard({
      options: { adapter: fromPartial(adapterMock) },
      metadata: () => fromAny({ actionTarget: "actionTarget", who: "who" }),
    });

    expect(adapterMock.can).toHaveBeenCalledWith("who", "actionTarget");
  });

  test("Should set authResult on request", async () => {
    const authResult = { success: true };

    const requestMock = {};

    await callGuard({
      options: {
        adapter: fromPartial({
          can: vi.fn(() => authResult),
        }),
      },
      metadata: () => fromAny({}),
      context: fromPartial({
        switchToHttp: () => ({
          getRequest: () => requestMock,
          getResponse: () => ({}),
        }),
      }),
    });

    expect((requestMock as any)[AUTH_RESULT_KEY]).toBe(authResult);
  });

  test.each(["forbidden", "not_found", "unknown"] as const)(
    "Should throw error if authorization fails",
    async (error) => {
      const requestMock = {};

      const result = callGuard({
        options: {
          adapter: fromPartial({
            can: vi.fn(() => ({ success: false, error })),
          }),
        },
        metadata: () => fromAny({}),
        context: fromPartial({
          switchToHttp: () => ({
            getRequest: () => requestMock,
            getResponse: () => ({}),
          }),
        }),
      });

      await expect(result).rejects.toThrow(new errorMap[error]());
      expect((requestMock as any)[AUTH_RESULT_KEY]).toEqual({
        success: false,
        error,
      });
    },
  );

  test("Should return true if authorization fails and manualErrorHandling is true", async () => {
    const requestMock = {};

    const result = callGuard({
      options: {
        adapter: fromPartial({
          can: vi.fn(() => ({ success: false, error: "forbidden" })),
        }),
        manualErrorHandling: true,
      },
      metadata: () => fromAny({}),
      context: fromPartial({
        switchToHttp: () => ({
          getRequest: () => requestMock,
          getResponse: () => ({}),
        }),
      }),
    });

    await expect(result).resolves.toBe(true);
    expect((requestMock as any)[AUTH_RESULT_KEY]).toEqual({
      success: false,
      error: "forbidden",
    });
  });

  test("Should throw forbidden error if authorization fails and notFoundBehavior is forbidden", async () => {
    const requestMock = {};

    const result = callGuard({
      options: {
        adapter: fromPartial({
          can: vi.fn(() => ({ success: false, error: "not_found" })),
        }),
        notFoundBehavior: "forbidden",
      },
      metadata: () => fromAny({}),
      context: fromPartial({
        switchToHttp: () => ({
          getRequest: () => requestMock,
          getResponse: () => ({}),
        }),
      }),
    });

    await expect(result).rejects.toThrow(new RebaTSForbiddenException());
    expect((requestMock as any)[AUTH_RESULT_KEY]).toEqual({
      success: false,
      error: "not_found",
    });
  });
});
