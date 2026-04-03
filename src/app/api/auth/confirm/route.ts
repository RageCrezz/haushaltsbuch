import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const redirectUrl = new URL("/", request.url);

  if (!token) {
    redirectUrl.searchParams.set("verificationError", "1");
    return NextResponse.redirect(redirectUrl);
  }

  const user = await prisma.user.findFirst({
    where: {
      emailVerificationToken: token,
      emailVerificationExpiresAt: {
        gt: new Date(),
      },
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    redirectUrl.searchParams.set("verificationError", "1");
    return NextResponse.redirect(redirectUrl);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifiedAt: new Date(),
      emailVerificationToken: null,
      emailVerificationExpiresAt: null,
    },
  });

  redirectUrl.searchParams.set("verified", "1");
  return NextResponse.redirect(redirectUrl);
}
