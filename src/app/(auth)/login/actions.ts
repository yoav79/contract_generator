"use server";

import { redirect } from "next/navigation";

import { POST_LOGIN_REDIRECT } from "@/lib/auth/constants";
import { verifyPassword } from "@/lib/auth/password";
import { setSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export type LoginFormState = {
  error?: string;
};

const INVALID_CREDENTIALS = "Credenciales inválidas.";

export async function loginAction(
  _prevState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: INVALID_CREDENTIALS };
  }

  const user = await db.user.findUnique({
    where: { email },
  });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: INVALID_CREDENTIALS };
  }

  await setSession({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  redirect(POST_LOGIN_REDIRECT);
}
