import { createHash, randomUUID } from "crypto";

const FALLBACK_IP = "unknown";

const getFirstForwardedIp = (forwardedFor: string | null): string | null => {
  if (!forwardedFor) return null;
  const first = forwardedFor.split(",")[0]?.trim();
  return first || null;
};

export const getClientIp = (request: Request): string => {
  const forwardedIp = getFirstForwardedIp(request.headers.get("x-forwarded-for"));
  const realIp = request.headers.get("x-real-ip")?.trim();
  return forwardedIp || realIp || FALLBACK_IP;
};

export const hashIp = (ip: string): string => {
  return createHash("sha256").update(ip).digest("hex").slice(0, 24);
};

export const getRequestId = (request: Request): string => {
  return request.headers.get("x-request-id") || randomUUID();
};

export const getRequestContext = (request: Request) => {
  const clientIp = getClientIp(request);
  return {
    requestId: getRequestId(request),
    clientIp,
    ipHash: hashIp(clientIp),
  };
};
