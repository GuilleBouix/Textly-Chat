import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type Namespace = "improve" | "users_meta";

type RateLimitResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      retryAfter: number;
    }
  | {
      ok: false;
      misconfigured: true;
    };

const IMPROVE_MAX = Number(process.env.RATE_LIMIT_IMPROVE_MAX ?? 20);
const USERS_META_MAX = Number(process.env.RATE_LIMIT_META_MAX ?? 60);
const WINDOW = "5 m";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const isRedisConfigured = Boolean(redisUrl && redisToken);

let improveRatelimit: Ratelimit | null = null;
let usersMetaRatelimit: Ratelimit | null = null;

const buildRateLimiter = (limit: number): Ratelimit | null => {
  if (!isRedisConfigured) return null;

  const redis = new Redis({
    url: redisUrl!,
    token: redisToken!,
  });

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, WINDOW),
    analytics: true,
    prefix: "textly-chat",
  });
};

const getNamespaceLimiter = (namespace: Namespace): Ratelimit | null => {
  if (namespace === "improve") {
    if (!improveRatelimit) improveRatelimit = buildRateLimiter(IMPROVE_MAX);
    return improveRatelimit;
  }

  if (!usersMetaRatelimit) usersMetaRatelimit = buildRateLimiter(USERS_META_MAX);
  return usersMetaRatelimit;
};

export const checkRateLimit = async ({
  namespace,
  userId,
  ipHash,
}: {
  namespace: Namespace;
  userId: string;
  ipHash: string;
}): Promise<RateLimitResult> => {
  const limiter = getNamespaceLimiter(namespace);

  if (!limiter) {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, misconfigured: true };
    }

    return { ok: true };
  }

  const key = `rl:${namespace}:${userId}:${ipHash}`;
  const result = await limiter.limit(key);

  if (result.success) {
    return { ok: true };
  }

  const retryAfterMs = Math.max(result.reset - Date.now(), 0);
  return {
    ok: false,
    retryAfter: Math.ceil(retryAfterMs / 1000),
  };
};
