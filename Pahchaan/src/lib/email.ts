export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function exactEmailPattern(email: string): RegExp {
  return new RegExp(`^${normalizeEmail(email).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
}
