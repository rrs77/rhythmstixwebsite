import jwt from "jsonwebtoken";
import type { Request, Response } from "express";

const JWT_SECRET = process.env.SESSION_SECRET || process.env.JWT_SECRET || (() => {
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET or JWT_SECRET environment variable is required in production");
  }
  return "rhythmstix-dev-only-secret";
})();
const COOKIE_NAME = "rx_token";
const ADMIN_COOKIE = "rx_admin";
const MAX_AGE = 24 * 60 * 60;

export interface UserPayload {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar: string;
}

export function signUserToken(user: UserPayload): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: MAX_AGE });
}

export function signAdminToken(): string {
  return jwt.sign({ isAdmin: true }, JWT_SECRET, { expiresIn: MAX_AGE });
}

export function verifyToken<T = any>(token: string): T | null {
  try {
    return jwt.verify(token, JWT_SECRET) as T;
  } catch {
    return null;
  }
}

export function setUserCookie(res: Response, user: UserPayload) {
  const token = signUserToken(user);
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: MAX_AGE * 1000,
    path: "/",
  });
}

export function setAdminCookie(res: Response) {
  const token = signAdminToken();
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: MAX_AGE * 1000,
    path: "/",
  });
}

export function clearUserCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

export function clearAdminCookie(res: Response) {
  res.clearCookie(ADMIN_COOKIE, { path: "/" });
}

export function getUserFromRequest(req: Request): UserPayload | null {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;
  return verifyToken<UserPayload>(token);
}

export function isAdminRequest(req: Request): boolean {
  const token = req.cookies?.[ADMIN_COOKIE];
  if (!token) return false;
  const payload = verifyToken<{ isAdmin: boolean }>(token);
  return payload?.isAdmin === true;
}
