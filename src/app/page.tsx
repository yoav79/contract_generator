import { redirect } from "next/navigation";

import { POST_LOGIN_REDIRECT } from "@/lib/auth/constants";
import { getSession, isAuthenticatedSession } from "@/lib/auth/session";

export default async function HomePage() {
  const session = await getSession();

  if (isAuthenticatedSession(session)) {
    redirect(POST_LOGIN_REDIRECT);
  }

  redirect("/login");
}
