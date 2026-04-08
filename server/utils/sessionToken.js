const crypto = require("crypto");

const SESSION_SECRET =
  String(process.env.SESSION_SECRET || "").trim() || "opw-dev-session-secret-change-me";

const base64UrlEncode = (value) =>
  Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const base64UrlDecode = (value) => {
  const normalized = String(value || "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, "base64").toString("utf8");
};

const signValue = (value) =>
  base64UrlEncode(
    crypto.createHmac("sha256", SESSION_SECRET).update(value).digest()
  );

const createSessionToken = (payload, expiresInSeconds = 60 * 60 * 12) => {
  const safePayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(safePayload));
  const signature = signValue(encodedPayload);
  return `${encodedPayload}.${signature}`;
};

const verifySessionToken = (token) => {
  const [encodedPayload, signature] = String(token || "").trim().split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signValue(encodedPayload);
  const expectedBuffer = Buffer.from(expectedSignature);
  const actualBuffer = Buffer.from(signature);

  if (
    expectedBuffer.length !== actualBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, actualBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));

    if (!payload?.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch (_) {
    return null;
  }
};

module.exports = {
  createSessionToken,
  verifySessionToken,
};
