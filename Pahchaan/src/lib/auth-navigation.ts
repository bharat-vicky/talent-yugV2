const fallback = "/pahchaan/dashboard";

// Only allow post-login destinations inside this application, never auth/API
// endpoints (which can restart authentication) or another origin.
export function safeAuthDestination(
  value: string | null | undefined,
  origin: string,
): string {
  if (!value || /[\\\u0000-\u0020]/.test(value)) return fallback;
  try {
    const url = new URL(value, origin);
    if (url.origin !== new URL(origin).origin || url.username || url.password)
      return fallback;
    if (
      !/^\/pahchaan\/(dashboard|onboarding|events|workspace|profile|templates|invite|invites)(\/|$)/.test(
        url.pathname,
      )
    )
      return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}

// NextAuth also uses its redirect callback for logout. Keep the login form's
// post-login allowlist above, while allowing logout to finish on the login page.
export function safeSessionRedirect(value: string, origin: string): string {
  try {
    const url = new URL(value, origin);
    if (
      url.origin === new URL(origin).origin &&
      !url.username &&
      !url.password &&
      !/[\\\u0000-\u0020]/.test(value) &&
      url.pathname === "/pahchaan/login"
    )
      return "/pahchaan/login";
  } catch {
    /* Use the restricted application destination. */
  }
  return safeAuthDestination(value, origin);
}
