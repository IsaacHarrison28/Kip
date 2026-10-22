/**
 * Convert a folder name into a URL-safe slug.
 * "Design Inspiration" → "design-inspiration"
 * "Maya's UI Kit" → "mayas-ui-kit"
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Generate a unique slug given a base and a "does this exist" check.
 * Falls back to appending -2, -3, etc.
 */
export async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const clean = slugify(base) || "collection";
  if (!(await exists(clean))) return clean;

  for (let i = 2; i < 100; i++) {
    const candidate = `${clean}-${i}`;
    if (!(await exists(candidate))) return candidate;
  }

  // Fallback: random suffix
  return `${clean}-${Math.random().toString(36).slice(2, 8)}`;
}
