export const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getRegisterValidationErrors(
  name: string,
  email: string,
  password: string,
  passwordMatch: string,
) {
  const errors: string[] = [];
  const trimmedName = name.trim();
  const trimmedEmail = email.trim();

  if (!trimmedName) {
    errors.push("Bitte einen Namen angeben.");
  }

  if (!trimmedEmail) {
    errors.push("Bitte eine E-Mail-Adresse angeben.");
  } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
    errors.push("Bitte eine gültige E-Mail-Adresse angeben.");
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(
      `Das Passwort ist zu kurz. Mindestens ${MIN_PASSWORD_LENGTH} Zeichen sind erforderlich.`,
    );
  }

  if (password !== passwordMatch) {
    errors.push("Die Passwörter stimmen nicht überein.");
  }

  return errors;
}

export function getRegisterValidationError(
  name: string,
  email: string,
  password: string,
  passwordMatch: string,
) {
  return (
    getRegisterValidationErrors(name, email, password, passwordMatch)[0] ?? null
  );
}

export function isRegisterFormValid(
  name: string,
  email: string,
  password: string,
  passwordMatch: string,
) {
  return (
    getRegisterValidationErrors(name, email, password, passwordMatch).length ===
    0
  );
}
