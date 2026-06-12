const TOKEN_VALUE_MIN_LENGTH = 32;

export function assertTokenValue(value: string, message: string): void {
  if (value.length < TOKEN_VALUE_MIN_LENGTH) throw new Error(message);
}

export function assertExpirationInFuture(expiresAt: Date): void {
  if (expiresAt <= new Date()) throw new Error("Expiration must be in the future");
}
