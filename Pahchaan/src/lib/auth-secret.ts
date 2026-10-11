// Keep session creation and proxy token verification on the same secret.
export const authSecret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
