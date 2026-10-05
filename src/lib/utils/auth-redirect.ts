export function getSafeRedirectPath(
  requestedPath: string | null,
  fallback = "/dashboard"
): string {
  if (
    !requestedPath ||
    !requestedPath.startsWith("/") ||
    requestedPath.startsWith("//") ||
    requestedPath.includes("\\")
  ) {
    return fallback;
  }

  return requestedPath;
}
