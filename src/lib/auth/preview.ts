/**
 * Shared LIVE-PREVIEW OAuth client metadata (server-only — NEVER import from the client).
 *
 * The sandbox serves each live preview on a dynamic `https://*.grok-sandbox.com`
 * URL, which can't be pre-registered per app. The broker instead exposes ONE
 * shared "preview" client that accepts any
 * `https://*.grok-sandbox.com/api/auth/oauth2/callback/*`
 * (broker: `app-builder-deployer/auth/src/preview-oauth.ts`).
 *
 * The preview client secret must come from the environment, never from source:
 *   - `GROK_AUTH_CLIENT_SECRET` (deployed / injector path; also used in `server.ts`)
 *   - `GROK_PREVIEW_CLIENT_SECRET` (preview-only fallback)
 * When neither is set, federated preview sign-in stays off (fail-closed; see
 * `authConfigured` in `server.ts`).
 *
 * A previous revision committed a real preview client secret in this file. That
 * value is compromised. The owner must rotate it (and the broker-side secret)
 * and purge it from git history. Do not put a secret back in this file.
 */
export const PREVIEW_CLIENT_ID = "grok_preview";

/** Read an env var, treating empty/whitespace as unset. */
const envTrim = (key: string): string | undefined => {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
};

/**
 * Preview OAuth client secret — environment only. Undefined when unset so
 * `authConfigured` in `server.ts` stays false (fail-closed).
 */
export const PREVIEW_CLIENT_SECRET: string | undefined =
  envTrim("GROK_AUTH_CLIENT_SECRET") ?? envTrim("GROK_PREVIEW_CLIENT_SECRET");

/** The shared auth broker issuer (OIDC discovery lives under it). */
export const GROK_ISSUER_DEFAULT = "https://auth.grok.me";

/**
 * Host patterns whose callbacks the preview client accepts. Better Auth derives
 * the live preview's real origin from the request host and validates it against
 * this list (wildcard-matched), so the OAuth `redirect_uri` becomes the concrete
 * `https://<preview-host>/api/auth/oauth2/callback/...` the broker allows.
 */
export const PREVIEW_ALLOWED_HOSTS = ["*.grok-sandbox.com"] as const;
