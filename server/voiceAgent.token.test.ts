import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("voiceAgent.createToken", () => {
  it("returns a short-lived token without exposing the permanent API key", async () => {
    const ctx = {
      user: null,
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    } satisfies TrpcContext;

    const result = await appRouter.createCaller(ctx).voiceAgent.createToken();

    expect(result.token).toBeTypeOf("string");
    expect(result.token.length).toBeGreaterThan(10);
    expect(result.expiresInSeconds).toBeGreaterThan(0);
    expect(result).not.toHaveProperty("apiKey");
  }, 15_000);
});
