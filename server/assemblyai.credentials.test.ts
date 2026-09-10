import { describe, expect, it } from "vitest";

describe("AssemblyAI credentials", () => {
  it("authenticates against the transcript listing endpoint", async () => {
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!apiKey) {
      // The AssemblyAI integration is opt-in for live mode. In demo mode (the default),
      // the public client never talks to AssemblyAI directly, so this credential check
      // is intentionally skipped when the operator has not configured a key.
      return;
    }

    const response = await fetch("https://api.assemblyai.com/v2/transcript?limit=1", {
      headers: { Authorization: apiKey as string },
    });

    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(403);
    expect(response.ok).toBe(true);
  }, 15_000);
});
