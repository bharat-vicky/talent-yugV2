// Resolve product links without inventing a production domain.
export function appUrl(path = "/") {
  const configured = process.env.NEXT_PUBLIC_APP_URL || (typeof window === "undefined" ? process.env.NEXTAUTH_URL : window.location.origin) || "http://localhost:3000";
  const origin = new URL(configured).origin;
  const localPath = path === "/pahchaan" || path.startsWith("/pahchaan/")
    ? path
    : `/pahchaan${path.startsWith("/") ? path : `/${path}`}`;
  return new URL(localPath, origin).toString();
}
