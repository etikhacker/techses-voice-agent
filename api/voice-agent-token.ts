type VercelRequest = {
  method?: string;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => VercelResponse;
  setHeader: (name: string, value: string) => VercelResponse;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "AssemblyAI is not configured" });
  }

  const response = await fetch(
    "https://agents.assemblyai.com/v1/token?expires_in_seconds=300&max_session_duration_seconds=900",
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );

  if (!response.ok) {
    const detail = await response.text();
    return res
      .status(response.status)
      .json({ error: "AssemblyAI token request failed", detail });
  }

  const payload = (await response.json()) as {
    token?: string;
    expires_in_seconds?: number;
  };
  if (!payload.token) {
    return res
      .status(502)
      .json({ error: "AssemblyAI returned no temporary token" });
  }

  return res.status(200).json({
    token: payload.token,
    expiresInSeconds: payload.expires_in_seconds ?? 300,
  });
}
