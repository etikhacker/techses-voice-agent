import { afterEach, describe, expect, it, vi } from "vitest";
import handler from "./voice-agent-token";

type MockResponse = {
  statusCode?: number;
  body?: unknown;
  headers: Record<string, string>;
  status: (code: number) => MockResponse;
  json: (body: unknown) => MockResponse;
  setHeader: (name: string, value: string) => MockResponse;
};

const response = (): MockResponse => {
  const result = { headers: {} } as MockResponse;
  result.status = code => {
    result.statusCode = code;
    return result;
  };
  result.json = body => {
    result.body = body;
    return result;
  };
  result.setHeader = (name, value) => {
    result.headers[name] = value;
    return result;
  };
  return result;
};

afterEach(() => vi.restoreAllMocks());

describe("Vercel voice-agent token route", () => {
  it("rejects non-GET requests", async () => {
    const res = response();
    await handler({ method: "POST" }, res);
    expect(res.statusCode).toBe(405);
    expect(res.headers.Allow).toBe("GET");
  });

  it("returns only the temporary token payload", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({
              token: "temporary-token",
              expires_in_seconds: 300,
            }),
            { status: 200 }
          )
        )
    );
    const res = response();
    await handler({ method: "GET" }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      token: "temporary-token",
      expiresInSeconds: 300,
    });
    expect(res.body).not.toHaveProperty("apiKey");
  });
});
