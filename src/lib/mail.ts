import nodemailer from "nodemailer";

export async function sendRegistrationConfirmationMail(
  to: string,
  name: string,
  confirmationUrl: string,
) {
  const from = process.env.MAIL_FROM ?? "haushaltsbuch@example.test";
  const greeting = name.trim() || "Hallo";

  await nodemailer
    .createTransport({
      host: process.env.MAIL_HOST ?? "localhost",
      port: Number(process.env.MAIL_PORT ?? "1026"),
      secure: false,
    })
    .sendMail({
    from,
    to,
    subject: "Bitte bestaetige deine E-Mail-Adresse",
    text: `${greeting},

bitte bestaetige deine E-Mail-Adresse ueber diesen Link:
${confirmationUrl}

Falls du dich nicht registriert hast, kannst du diese E-Mail ignorieren.`,
    });
}
