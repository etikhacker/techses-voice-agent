import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  voiceAgent: router({
    createToken: publicProcedure.query(async () => {
      if (!ENV.assemblyAiApiKey) {
        throw new Error("AssemblyAI is not configured on the server");
      }

      const response = await fetch(
        "https://agents.assemblyai.com/v1/token?expires_in_seconds=300&max_session_duration_seconds=900",
        { headers: { Authorization: `Bearer ${ENV.assemblyAiApiKey}` } }
      );

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(
          `AssemblyAI token request failed (${response.status}): ${detail}`
        );
      }

      const payload = (await response.json()) as {
        token?: string;
        expires_in_seconds?: number;
      };
      if (!payload.token) {
        throw new Error("AssemblyAI returned no temporary token");
      }

      return {
        token: payload.token,
        expiresInSeconds: payload.expires_in_seconds ?? 300,
      };
    }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
