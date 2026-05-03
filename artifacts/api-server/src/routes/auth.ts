import { Router, type Request, type Response, type NextFunction } from "express";
import rateLimit from "express-rate-limit";
import {
  subscribeToMailchimp,
  unsubscribeFromMailchimp,
  getSubscriptionStatus,
  isMailchimpConfigured,
} from "../lib/mailchimp";
import {
  getUserFromRequest,
  isAdminRequest,
  setUserCookie,
  setAdminCookie,
  clearUserCookie,
  clearAdminCookie,
  type UserPayload,
} from "../lib/jwt";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again later." },
});

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many admin login attempts. Please try again later." },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many registration attempts. Please try again later." },
});
const WP_BASE = (process.env.WP_BASE_URL || "https://www.rhythmstix.co.uk").replace(/\/$/, "");
const WC_BASE = `${WP_BASE}/wp-json/wc/v3`;
const WC_KEY = process.env.WC_CONSUMER_KEY || "";
const WC_SECRET = process.env.WC_CONSUMER_SECRET || "";

const WC_AUTH_HEADER = `Basic ${Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString("base64")}`;

function wcUrl(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${WC_BASE}/${endpoint}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url.toString();
}

function wcFetch(endpoint: string, params: Record<string, string> = {}) {
  return fetch(wcUrl(endpoint, params), {
    headers: { Authorization: WC_AUTH_HEADER },
  });
}

async function findWcCustomer(email: string) {
  const res = await wcFetch("customers", { email, per_page: "1" });
  if (!res.ok) return null;
  const customers = await res.json() as any[];
  return customers.length > 0 ? customers[0] : null;
}

async function wpAuthenticate(username: string, password: string): Promise<boolean> {
  try {
    const body = new URLSearchParams({
      log: username,
      pwd: password,
      "wp-submit": "Log In",
      redirect_to: `${WP_BASE}/`,
      testcookie: "1",
    });

    const res = await fetch(`${WP_BASE}/wp-login.php`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      redirect: "manual",
    });

    return res.status === 302;
  } catch {
    return false;
  }
}

router.post("/auth/login", loginLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const customer = await findWcCustomer(email);
    if (!customer) {
      res.status(401).json({ error: "No account found with that email address" });
      return;
    }

    const authenticated = await wpAuthenticate(customer.username || email, password);
    if (!authenticated) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const user: UserPayload = {
      id: customer.id,
      email: customer.email,
      firstName: customer.first_name,
      lastName: customer.last_name,
      username: customer.username,
      avatar: customer.avatar_url,
    };

    setUserCookie(res, user);

    res.json({
      success: true,
      user,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "An error occurred during login" });
  }
});

router.post("/auth/logout", (_req: Request, res: Response) => {
  clearUserCookie(res);
  clearAdminCookie(res);
  res.json({ success: true });
});

router.get("/auth/me", (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  if (user) {
    res.json({ authenticated: true, user });
  } else {
    res.json({ authenticated: false, user: null });
  }
});

router.post("/auth/register", registerLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, subscribe } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }

    const existing = await findWcCustomer(email);
    if (existing) {
      res.status(409).json({ error: "An account with that email already exists. Please sign in instead." });
      return;
    }

    const createRes = await fetch(wcUrl("customers"), {
      method: "POST",
      headers: {
        Authorization: WC_AUTH_HEADER,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        first_name: firstName || "",
        last_name: lastName || "",
        username: email.split("@")[0] + Math.floor(Math.random() * 1000),
      }),
    });

    if (!createRes.ok) {
      const errData = (await createRes.json().catch(() => ({}))) as any;
      const msg = errData?.message || "Failed to create account";
      res.status(createRes.status).json({ error: msg });
      return;
    }

    const customer = (await createRes.json()) as any;

    if (subscribe) {
      await subscribeToMailchimp(email, firstName, lastName, ["website-signup"]);
    }

    const user: UserPayload = {
      id: customer.id,
      email: customer.email,
      firstName: customer.first_name,
      lastName: customer.last_name,
      username: customer.username,
      avatar: customer.avatar_url,
    };

    setUserCookie(res, user);

    res.json({ success: true, user });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "An error occurred during registration" });
  }
});

router.get("/account/subscription", async (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const configured = isMailchimpConfigured();
  if (!configured) {
    res.json({ configured: false, subscribed: false });
    return;
  }

  const status = await getSubscriptionStatus(user.email);
  res.json({ configured: true, subscribed: status.subscribed });
});

router.post("/account/subscription", async (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const { subscribe } = req.body;

  if (subscribe) {
    const result = await subscribeToMailchimp(
      user.email,
      user.firstName,
      user.lastName,
      ["website-signup"]
    );
    if (!result.success) {
      res.status(502).json({ error: result.error || "Failed to subscribe" });
      return;
    }
    res.json({ success: true, subscribed: true });
  } else {
    const result = await unsubscribeFromMailchimp(user.email);
    if (!result.success) {
      res.status(502).json({ error: result.error || "Failed to unsubscribe" });
      return;
    }
    res.json({ success: true, subscribed: false });
  }
});

router.post("/auth/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    const customer = await findWcCustomer(email);
    if (!customer) {
      res.json({ success: true, message: "If an account exists with that email, a password reset link has been sent." });
      return;
    }

    const body = new URLSearchParams({
      user_login: email,
      "wp-submit": "Get New Password",
      redirect_to: "",
    });

    await fetch(`${WP_BASE}/wp-login.php?action=lostpassword`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      redirect: "manual",
    });

    res.json({ success: true, message: "If an account exists with that email, a password reset link has been sent." });
  } catch {
    res.json({ success: true, message: "If an account exists with that email, a password reset link has been sent." });
  }
});

router.get("/account/orders", async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const response = await wcFetch("orders", {
      customer: String(user.id),
      per_page: "50",
      orderby: "date",
      order: "desc",
    });

    if (!response.ok) {
      res.status(500).json({ error: "Failed to fetch orders" });
      return;
    }

    const orders = await response.json() as any[];
    const mapped = orders.map((o: any) => ({
      id: o.id,
      number: o.number,
      status: o.status,
      dateCreated: o.date_created,
      total: o.total,
      currency: o.currency,
      paymentMethod: o.payment_method_title,
      items: (o.line_items || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        total: item.total,
        productId: item.product_id,
      })),
      billing: {
        firstName: o.billing?.first_name,
        lastName: o.billing?.last_name,
        email: o.billing?.email,
        company: o.billing?.company,
      },
    }));

    res.json(mapped);
  } catch {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.get("/account/orders/:id", async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const response = await wcFetch(`orders/${req.params.id}`);
    if (!response.ok) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const o = await response.json() as any;
    if (o.customer_id !== user.id) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    res.json({
      id: o.id,
      number: o.number,
      status: o.status,
      dateCreated: o.date_created,
      total: o.total,
      currency: o.currency,
      paymentMethod: o.payment_method_title,
      items: (o.line_items || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        total: item.total,
        price: item.price,
        productId: item.product_id,
      })),
      billing: o.billing,
      shipping: o.shipping,
      customerNote: o.customer_note,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = getUserFromRequest(req);
  if (user) {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

router.post("/auth/admin-login", adminLoginLimiter, (req: Request, res: Response) => {
  if (!ADMIN_PASSWORD) {
    res.status(503).json({ error: "Admin login not configured" });
    return;
  }
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    setAdminCookie(res);
    res.json({ success: true });
  } else {
    res.status(401).json({ error: "Invalid password" });
  }
});

router.get("/auth/admin-check", (req: Request, res: Response) => {
  res.json({ authenticated: isAdminRequest(req) });
});

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (isAdminRequest(req)) {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
}

export default router;
