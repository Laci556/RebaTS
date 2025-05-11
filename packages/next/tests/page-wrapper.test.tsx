// @vitest-environment happy-dom

import { RebaTSClient } from "@rebats/core";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { createPageAuthWrapper } from "../src/page-wrapper";

describe("Next page wrapper", () => {
  const clientMock = new RebaTSClient({} as any);
  const componentMock = () => <div>Component</div>;
  const config = {
    notFoundComponent: () => <div>not_found</div>,
    forbiddenComponent: () => <div>forbidden</div>,
    unknownComponent: () => <div>unknown</div>,
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("Should skip authorization if params are not provided", async () => {
    const pageWrapper = createPageAuthWrapper(clientMock, config);

    const Page = pageWrapper(componentMock, () => undefined);
    render(await Page({}));

    expect(screen.getByText("Component")).toBeInTheDocument();
  });

  test("Should render the component if authorization is successful", async () => {
    const pageWrapper = createPageAuthWrapper(clientMock, config);
    vi.spyOn(clientMock, "can").mockResolvedValue({ success: true });

    const Page = pageWrapper(componentMock, () => ({}) as any);
    render(await Page({}));

    expect(screen.getByText("Component")).toBeInTheDocument();
  });

  test.each(["unknown", "not_found", "forbidden"] as const)(
    "Should render error component if authorization fails",
    async (errorType) => {
      const pageWrapper = createPageAuthWrapper(clientMock, config);
      vi.spyOn(clientMock, "can").mockResolvedValue({
        success: false,
        error: errorType,
      });

      const Page = pageWrapper(componentMock, () => ({}) as any);
      render(await Page({}));

      expect(screen.getByText(errorType)).toBeInTheDocument();
    },
  );

  test("Should handle error manually if config is set", async () => {
    const pageWrapper = createPageAuthWrapper(clientMock, {
      ...config,
      manualErrorHandling: true,
    });
    vi.spyOn(clientMock, "can").mockResolvedValue({
      success: false,
      error: "unknown",
    });

    const Page = pageWrapper(
      ({ authResult }) => <div>Manual error: {authResult?.error}</div>,
      () => ({}) as any,
    );
    render(await Page({}));

    expect(screen.getByText("Manual error: unknown")).toBeInTheDocument();
  });

  test("Should return not_found as forbidden if notFoundBehavior is set to forbidden", async () => {
    const pageWrapper = createPageAuthWrapper(clientMock, {
      ...config,
      notFoundBehavior: "forbidden",
    });
    vi.spyOn(clientMock, "can").mockResolvedValue({
      success: false,
      error: "not_found",
    });

    const Page = pageWrapper(componentMock, () => ({}) as any);
    render(await Page({}));

    expect(screen.getByText("forbidden")).toBeInTheDocument();
  });

  test("Should pass props object to selector", async () => {
    const pageWrapper = createPageAuthWrapper(clientMock, config);
    const selector = vi.fn();

    const Page = pageWrapper(
      ({ foo }: { foo: "bar" }) => <div>Component {foo}</div>,
      selector as any,
    );
    render(await Page({ foo: "bar" }));

    expect(selector).toHaveBeenCalledWith({ foo: "bar" }, expect.anything());
    expect(screen.getByText("Component bar")).toBeInTheDocument();
  });
});
