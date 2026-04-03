import {
  createEmailVerificationToken,
  hashPassword,
} from "@/lib/auth";
import { jsonError } from "@/lib/http";
import { sendRegistrationConfirmationMail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { getRegisterValidationError } from "@/lib/register-validation";

export const dynamic = "force-dynamic";

type RegisterBody = {
  name?: string;
  email?: string;
  password?: string;
  passwordMatch?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as RegisterBody | null;
  const name = body?.name?.trim() ?? "";
  const email = body?.email?.trim().toLowerCase() ?? "";
  const password = body?.password ?? "";
  const passwordMatch = body?.passwordMatch ?? "";

  const validationError = getRegisterValidationError(
    name,
    email,
    password,
    passwordMatch,
  );

  if (validationError) {
    return jsonError(validationError, 400);
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return jsonError("Diese E-Mail-Adresse ist bereits vergeben.", 409);
  }

  const token = createEmailVerificationToken();
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: hashPassword(password),
      emailVerificationToken: token,
      emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  const confirmationUrl = new URL("/api/auth/confirm", request.url);
  confirmationUrl.searchParams.set("token", token);

  try {
    await sendRegistrationConfirmationMail(
      user.email,
      user.name,
      confirmationUrl.toString(),
    );
  } catch {
    await prisma.user.delete({ where: { id: user.id } });

    return jsonError(
      "Die Bestätigungs-E-Mail konnte nicht gesendet werden. Bitte versuche es erneut.",
      500,
    );
  }

  return Response.json({
    ok: true,
    user: { id: user.id, email: user.email, name: user.name },
  });
}
