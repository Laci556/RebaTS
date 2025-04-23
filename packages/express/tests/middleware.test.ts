import { RebaTSClient, type DatabaseAdapter } from "@rebats/core";
import { fromAny, fromPartial } from "@total-typescript/shoehorn";
import { type Response } from "express";
import { beforeEach, describe, expect, test, vi, type Mock } from "vitest";
import { authorize, rebatsMiddleware } from "../src/middleware";
import { ForbiddenError } from "../src/types";

describe("Express middleware", () => {
  let nextMock: Mock;

  beforeEach(() => {
    nextMock = vi.fn();
  });

  describe("rebatsMiddleware", () => {
    test("Should initialize middleware with client", () => {
      const client = new RebaTSClient({} as any);
      const responseMock = fromPartial<Response>({ locals: {} });

      rebatsMiddleware(client, {
        manualErrorHandling: true,
        notFoundBehavior: "forbidden",
      })(fromPartial({}), responseMock, nextMock);

      expect(responseMock.locals.rebats).toEqual({
        client,
        config: { manualErrorHandling: true, notFoundBehavior: "forbidden" },
      });
      expect(nextMock).toHaveBeenCalledWith();
    });

    test("Should initialize middleware with adapter", () => {
      const adapterMock = fromAny<DatabaseAdapter<any>, string>("adapterMock");
      const responseMock = fromPartial<Response>({ locals: {} });

      rebatsMiddleware(adapterMock, {
        manualErrorHandling: true,
        notFoundBehavior: "forbidden",
      })(fromPartial({}), responseMock, nextMock);

      expect(responseMock.locals.rebats).toEqual({
        client: expect.any(RebaTSClient),
        config: { manualErrorHandling: true, notFoundBehavior: "forbidden" },
      });
      expect(nextMock).toHaveBeenCalledWith();
    });
  });

  describe("authorize", () => {
    test("Should throw error if middleware is not initialized", async () => {
      await authorize(() => undefined)(
        fromPartial({}),
        fromPartial({ locals: {} }),
        nextMock,
      );

      expect(nextMock).toHaveBeenCalledWith(
        new Error(
          "RebaTS middleware not initialized. Did you forget to call app.use(rebatsMiddleware())?",
        ),
      );
    });

    test("Should skip authorization if no check is provided", async () => {
      await authorize(() => undefined)(
        fromPartial({}),
        fromPartial({ locals: { rebats: {} } }),
        nextMock,
      );

      expect(nextMock).toHaveBeenCalledWith();
    });

    test.each(["forbidden", "not_found", "unknown"])(
      "Should call next with error",
      async (error) => {
        await authorize(() => ({}) as any)(
          fromPartial({}),
          fromPartial({
            locals: {
              rebats: { client: { can: () => ({ success: false, error }) } },
            },
          }),
          nextMock,
        );

        expect(nextMock).toHaveBeenCalledWith(
          expect.objectContaining({ type: error }),
        );
      },
    );

    test("Should call next without error if authorization is successful", async () => {
      const responseMock = fromPartial<Response>({
        locals: { rebats: { client: { can: () => ({ success: true }) } } },
      });

      await authorize(() => ({}) as any)(
        fromPartial({}),
        responseMock,
        nextMock,
      );

      expect(responseMock.locals.rebats.result).toEqual({
        success: true,
      });
      expect(nextMock).toHaveBeenCalledWith();
    });

    test.each(["forbidden", "not_found", "unknown"])(
      "Should handle error manually if config is set",
      async (error) => {
        const responseMock = fromPartial<Response>({
          locals: {
            rebats: {
              client: { can: () => ({ success: false, error }) },
              config: { manualErrorHandling: true },
            },
          },
        });

        await authorize(() => ({ who: null, actionTarget: null }) as any)(
          fromPartial({}),
          responseMock,
          nextMock,
        );

        expect(responseMock.locals.rebats.result).toEqual({
          success: false,
          error,
        });
        expect(nextMock).toHaveBeenCalledWith();
      },
    );

    test("Should return not_found as forbidden if notFoundBehavior is set to forbidden", async () => {
      const responseMock = fromPartial<Response>({
        locals: {
          rebats: {
            client: { can: () => ({ success: false, error: "not_found" }) },
            config: { notFoundBehavior: "forbidden" },
          },
        },
      });

      await authorize(() => ({ who: null, actionTarget: null }) as any)(
        fromPartial({}),
        responseMock,
        nextMock,
      );

      expect(responseMock.locals.rebats.result).toEqual({
        success: false,
        error: "not_found",
      });
      expect(nextMock).toHaveBeenCalledWith(new ForbiddenError());
    });

    test("Should use request and response objects in selector", async () => {
      const canMock = vi.fn(() => ({ success: true }));

      await authorize(
        (req, res) =>
          ({ who: res.locals.userId, actionTarget: req.params.id }) as any,
      )(
        fromPartial({ params: { id: "targetId" } }),
        fromPartial({
          locals: {
            userId: "userId",
            rebats: { client: { can: canMock } },
          },
        }),
        nextMock,
      );

      expect(canMock).toHaveBeenCalledWith("userId", "targetId");
    });
  });
});
