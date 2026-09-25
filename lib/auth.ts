import { cookies } from "next/headers";
import { prisma } from "./db";
import bcrypt from "bcryptjs";
import { randomBytes, createHmac, timingSafeEqual } from "crypto";
import type { User, UserRole } from "@prisma/client";

const SESSION_COOKIE_NAME = "psi_session";
const SESSION_DURATION_DAYS = 7;

export type SafeUser = Omit<User, "passwordHash">;

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Verify password
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate session token
export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

// Create session
export async function createSession(userId: string): Promise<string> {
  const token = generateSessionToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return token;
}

// Set session cookie
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
    path: "/",
  });
}

// Get session from cookie
export async function getSessionFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

// Clear session cookie
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// Get current user from session
export async function getCurrentUser(): Promise<SafeUser | null> {
  const token = await getSessionFromCookie();
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) return null;
  if (new Date() > session.expiresAt) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...safeUser } = session.user;
  return safeUser;
}

// Validate user has required role
export function hasRole(user: SafeUser | null, roles: UserRole[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

// Login user
export async function loginUser(
  email: string,
  password: string
): Promise<{ success: boolean; user?: SafeUser; error?: string }> {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return { success: false, error: "Invalid email or password" };
  }

  if (!user.isActive) {
    return { success: false, error: "Account is deactivated" };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { success: false, error: "Invalid email or password" };
  }

  const token = await createSession(user.id);
  await setSessionCookie(token);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...safeUser } = user;
  return { success: true, user: safeUser };
}

// Logout user
export async function logoutUser(): Promise<void> {
  const token = await getSessionFromCookie();
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
  await clearSessionCookie();
}

// Generate secure token for delivery links
export function generateSecureToken(
  inspectionId: string,
  clientEmail: string,
  expiresAt: Date
): string {
  const secret = process.env.NEXTAUTH_SECRET || process.env.ABACUSAI_API_KEY;
  if (!secret) {
    throw new Error("No secret configured for token generation. Set NEXTAUTH_SECRET.");
  }
  const nonce = randomBytes(16).toString("hex");
  const message = `${inspectionId}:${clientEmail}:${expiresAt.toISOString()}:${nonce}`;
  const hmac = createHmac("sha256", secret).update(message).digest("hex");
  return Buffer.from(`${hmac}:${nonce}`).toString("base64url");
}

// Verify secure token
export function verifySecureToken(
  token: string,
  inspectionId: string,
  clientEmail: string,
  expiresAt: Date
): boolean {
  try {
    const decoded = Buffer.from(token, "base64url").toString();
    const [hmac, nonce] = decoded.split(":");
    if (!hmac || !nonce) return false;
    const secret = process.env.NEXTAUTH_SECRET || process.env.ABACUSAI_API_KEY;
    if (!secret) return false;
    const message = `${inspectionId}:${clientEmail}:${expiresAt.toISOString()}:${nonce}`;
    const expectedHmac = createHmac("sha256", secret).update(message).digest("hex");
    // Use timing-safe comparison to prevent timing attacks
    const provided = Buffer.from(hmac, "hex");
    const expected = Buffer.from(expectedHmac, "hex");
    if (provided.length !== expected.length) return false;
    return timingSafeEqual(provided, expected);
  } catch {
    return false;
  }
}
