import { UserRole } from "@prisma/client";

import { hashPassword } from "../src/lib/auth/password";
import { db } from "../src/lib/db";

const DEV_USERS = [
  {
    email: "lawyer@local.dev",
    name: "Lawyer Local",
    role: UserRole.LAWYER,
    password: "ChangeMeLawyer123!",
  },
  {
    email: "admin@local.dev",
    name: "Admin Staff Local",
    role: UserRole.ADMIN_STAFF,
    password: "ChangeMeAdmin123!",
  },
] as const;

async function main() {
  for (const user of DEV_USERS) {
    const passwordHash = await hashPassword(user.password);

    const result = await db.user.upsert({
      where: { email: user.email },
      create: {
        email: user.email,
        name: user.name,
        role: user.role,
        passwordHash,
      },
      update: {
        name: user.name,
        role: user.role,
        passwordHash,
      },
    });

    const hasPasswordHash =
      typeof result.passwordHash === "string" && result.passwordHash.length > 0;

    console.log(
      `Usuario ${result.email} (${result.role}): creado o actualizado — passwordHash: ${hasPasswordHash ? "presente" : "ausente"}`,
    );
  }
}

main()
  .catch((error) => {
    console.error("Error al ejecutar el seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
