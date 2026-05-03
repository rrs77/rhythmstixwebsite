import { Router, type Request, type Response } from "express";
import { put } from "@vercel/blob";
import { requireAdmin } from "./auth";

const router = Router();

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

const MAX_BYTES = 5 * 1024 * 1024;

router.post(
  "/uploads/image",
  requireAdmin,
  async (req: Request, res: Response) => {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      res
        .status(503)
        .json({ error: "Image uploads are not configured (missing token)." });
      return;
    }

    const filename = String(req.query["filename"] ?? "").trim();
    const contentType = String(req.headers["content-type"] ?? "");

    if (!filename) {
      res.status(400).json({ error: "filename query param required" });
      return;
    }
    if (!ALLOWED_TYPES.has(contentType)) {
      res.status(415).json({ error: `Unsupported file type: ${contentType}` });
      return;
    }

    const chunks: Buffer[] = [];
    let total = 0;
    try {
      for await (const chunk of req) {
        const buf = chunk as Buffer;
        total += buf.length;
        if (total > MAX_BYTES) {
          res.status(413).json({ error: "File exceeds 5MB limit" });
          return;
        }
        chunks.push(buf);
      }
    } catch (err) {
      req.log.error({ err }, "upload stream error");
      res.status(400).json({ error: "Upload failed" });
      return;
    }

    const body = Buffer.concat(chunks);
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `site/${Date.now()}-${safeName}`;

    try {
      const blob = await put(key, body, {
        access: "public",
        contentType,
        token: process.env.BLOB_READ_WRITE_TOKEN,
        addRandomSuffix: false,
      });
      res.json({ url: blob.url, pathname: blob.pathname });
    } catch (err) {
      req.log.error({ err }, "vercel blob put failed");
      res.status(502).json({ error: "Storage upload failed" });
    }
  },
);

export default router;
