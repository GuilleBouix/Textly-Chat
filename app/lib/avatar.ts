export const DEFAULT_AVATAR_SRC = "/default-avatar.png";

export const normalizeAvatarUrl = (value: unknown): string | null => {
  if (typeof value !== "string") return null;

  const raw = value.trim();
  if (!raw) return null;
  if (raw === "null" || raw === "undefined") return null;

  if (raw.startsWith("//")) {
    return `https:${raw}`;
  }

  return raw;
};

export const pickAvatarFromMetadata = (
  metadata?: Record<string, unknown> | null,
): string | null => {
  const candidates: unknown[] = [
    metadata?.avatar_url,
    metadata?.picture,
    metadata?.avatar,
    metadata?.imagen,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeAvatarUrl(candidate);
    if (normalized) return normalized;
  }

  return null;
};
