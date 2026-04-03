import { hashPassword } from "@/lib/auth";
import { jsonError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const TEST_USER = {
  email: "e2e@example.com",
  name: "E2E User",
  password: "Passwort123",
};

function e2eDisabled() {
  return process.env.ENABLE_E2E_TESTS !== "true";
}

export async function POST() {
  if (e2eDisabled()) {
    return jsonError("E2E-Tests sind nicht aktiviert.", 404);
  }

  const user = await prisma.user.upsert({
    where: { email: TEST_USER.email },
    update: {
      name: TEST_USER.name,
      passwordHash: hashPassword(TEST_USER.password),
      emailVerifiedAt: new Date(),
      emailVerificationToken: null,
      emailVerificationExpiresAt: null,
      salaryCents: 0,
    },
    create: {
      email: TEST_USER.email,
      name: TEST_USER.name,
      passwordHash: hashPassword(TEST_USER.password),
      emailVerifiedAt: new Date(),
      salaryCents: 0,
    },
    select: { id: true },
  });

  await prisma.session.deleteMany({
    where: { userId: user.id },
  });

  await prisma.fixedCost.deleteMany({
    where: { userId: user.id },
  });

  await prisma.expense.deleteMany({
    where: { userId: user.id },
  });

  return Response.json(TEST_USER);
}
