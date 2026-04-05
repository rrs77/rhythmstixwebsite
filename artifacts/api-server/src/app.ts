import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

const allowedOrigins: string[] = [];

if (process.env.REPLIT_DEV_DOMAIN) {
  allowedOrigins.push(`https://${process.env.REPLIT_DEV_DOMAIN}`);
}
if (process.env.REPLIT_DOMAINS) {
  for (const d of process.env.REPLIT_DOMAINS.split(",")) {
    allowedOrigins.push(`https://${d.trim()}`);
  }
}
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}
if (process.env.VERCEL_URL) {
  allowedOrigins.push(`https://${process.env.VERCEL_URL}`);
}
if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
  allowedOrigins.push(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
}
if (allowedOrigins.length === 0) {
  allowedOrigins.push("http://localhost:3000", "http://localhost:5173");
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some((o) => origin === o)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api", router);

export default app;
