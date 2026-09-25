export const CANONICAL_SITE_URL = "https://precisionsewerinspections.com";

export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || CANONICAL_SITE_URL).replace(/\/$/, "");
}
