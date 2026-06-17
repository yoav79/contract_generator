import { UserRole } from "@prisma/client";
import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

import {
  MIN_SESSION_SECRET_LENGTH,
  SESSION_COOKIE_NAME,
} from "./constants";

export type AuthSessionData = {
  userId: string;
  email: string;
  role: UserRole;
};

export type AuthSessionUser = AuthSessionData;

type SessionPayload = Partial<AuthSessionData>;

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error(
      "SESSION_SECRET no está configurado. Agrégalo en .env con al menos 32 caracteres.",
    );
  }

  if (secret.length < MIN_SESSION_SECRET_LENGTH) {
    throw new Error(
      `SESSION_SECRET debe tener al menos ${MIN_SESSION_SECRET_LENGTH} caracteres.`,
    );
  }

  return secret;
}

export function getSessionOptions(): SessionOptions {
  return {
    password: getSessionSecret(),
    cookieName: SESSION_COOKIE_NAME,
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },
  };
}

export async function getSession(): Promise<
  Awaited<ReturnType<typeof getIronSession<SessionPayload>>>
> {
  return getIronSession<SessionPayload>(await cookies(), getSessionOptions());
}

export async function setSession(user: AuthSessionUser): Promise<void> {
  const session = await getSession();

  session.userId = user.userId;
  session.email = user.email;
  session.role = user.role;

  await session.save();
}

export async function destroySession(): Promise<void> {
  const session = await getSession();
  session.destroy();
}

export function isAuthenticatedSession(
  session: SessionPayload,
): session is AuthSessionData {
  return (
    typeof session.userId === "string" &&
    typeof session.email === "string" &&
    typeof session.role === "string"
  );
}
