// Vercel serverless function: wraps the existing Express app so we can deploy
// the entire API as a single function without rewriting every route.
//
// Vercel auto-discovers `api/*.ts` at the project root. The vercel.json at
// the project root rewrites all `/api/*` paths to `/api/index`, so this one
// handler serves the whole API surface (Express does its own routing inside).
//
// Locally on Replit we still run the long-lived Express server in
// `artifacts/api-server` via the workflow — this file is only invoked by
// Vercel's runtime in production.
import app from "../artifacts/api-server/src/app";

export default app;
