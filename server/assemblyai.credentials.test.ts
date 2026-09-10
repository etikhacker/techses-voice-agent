import { describe, expect, it } from "vitest";

describe("AssemblyAI credentials", () => {
  it("authenticates against the transcript listing endpoint", async () => {
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    expect(apiKey, "ASSEMBLYAI_API_KEY must be configured").toBeTruthy();

    const response = await fetch("https://api.assemblyai.com/v2/transcript?limit=1", {
      headers: { Authorization: apiKey as string },
    });

    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(403);
    expect(response.ok).toBe(true);
  }, 15_000);
});
