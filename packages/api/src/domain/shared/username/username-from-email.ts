const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 30;
const FALLBACK_USERNAME = "usuario";

export function usernameFromEmail(email: string): string {
  const localPart = email.split("@")[0] ?? "";
  const cleaned = localPart.replace(/[^\p{L}\d_]/gu, "");
  return cleaned.length >= USERNAME_MIN_LENGTH ? cleaned.slice(0, USERNAME_MAX_LENGTH) : FALLBACK_USERNAME;
}
