import { hashPassword } from "@/lib/auth";
import { jsonError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as
    | { username?: string; password?: string }
    | null;

  const username = body?.username ?? "";
  const password = body?.password ?? "";

  const existingUser = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (existingUser) {
    return jsonError("Der Benutzername ist bereits vergeben.", 409);
  }

  const user = await prisma.user.create({
    data: {
      username,
      passwordHash: hashPassword(password),
    },
  });

  return Response.json({
    ok: true,
    user: { id: user.id, username: user.username },
  });
}
