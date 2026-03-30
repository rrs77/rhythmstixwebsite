import { Router, type Request, type Response, type NextFunction } from "express";

const router = Router();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "rhythmstix2024";

router.post("/auth/login", (req: Request, res: Response) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    (req.session as any).isAdmin = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: "Invalid password" });
  }
});

router.post("/auth/logout", (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

router.get("/auth/check", (req: Request, res: Response) => {
  res.json({ authenticated: !!(req.session as any)?.isAdmin });
});

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if ((req.session as any)?.isAdmin) {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
}

export default router;
