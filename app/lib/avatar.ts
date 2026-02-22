export function normalizeAvatarUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  // Some OAuth providers return protocol-relative URLs: //host/path
  if (/^\/\/\S+$/i.test(trimmed)) {
    return `https:${trimmed}`;
  }

  if (/^https?:\/\/\S+$/i.test(trimmed)) {
    return trimmed;
  }

  // Allow inline avatars when explicitly provided.
  if (/^data:image\/[a-zA-Z]+;base64,/i.test(trimmed)) {
    return trimmed;
  }

  return null;
}
