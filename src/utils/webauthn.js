// ─────────────────────────────────────────────────────────────────
// webauthn.js — fingerprint / face unlock via the WebAuthn platform
// authenticator (Touch ID, Android fingerprint, Windows Hello).
//
// A credential is registered once from Settings → Security and stored
// as a plain credential id (base64url). Unlocking is a get() assertion
// whose userHandle must match the enrolled user. Nothing leaves the
// device; no server is involved (this is a local PWA).
// ─────────────────────────────────────────────────────────────────

const b64u = {
  enc(buf) {
    return btoa(String.fromCharCode(...new Uint8Array(buf)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  },
  dec(str) {
    const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4))
    const s = atob(str.replace(/-/g, '+').replace(/_/g, '/') + pad)
    return Uint8Array.from(s, (c) => c.charCodeAt(0))
  },
}

/** Feature detection — false on http:// (needs secure context), old browsers. */
export function webauthnAvailable() {
  return typeof window !== 'undefined' &&
    window.isSecureContext !== false &&
    Boolean(window.PublicKeyCredential) &&
    typeof window.PublicKeyCredential === 'function'
}

/** True when the device has an internal biometric sensor. */
export async function platformAuthenticatorAvailable() {
  try {
    if (!webauthnAvailable()) return false
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

/**
 * Register a fingerprint for a user. Returns the base64url credential
 * id to store in settings.security.fingerprintCredentialId.
 * Throws on cancel/failure — callers should surface err.name
 * ('NotAllowedError' = user cancelled).
 */
export async function registerFingerprint({ userId, userName = 'Factory Owner' }) {
  if (!webauthnAvailable()) throw new Error('WebAuthn not available')
  const challenge = new Uint8Array(32)
  crypto.getRandomValues(challenge)
  const userIdBytes = new TextEncoder().encode(userId)
  const cred = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: 'Marble Manager' },
      user: { id: userIdBytes, name: userName, displayName: userName },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },   // ES256
        { type: 'public-key', alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60000,
      attestation: 'none',
    },
  })
  return b64u.enc(cred.rawId)
}

/**
 * Verify the enrolled fingerprint. Resolves true when the platform
 * authenticator asserts the stored credential id.
 */
export async function verifyFingerprint(credentialIdB64u) {
  if (!webauthnAvailable() || !credentialIdB64u) return false
  const challenge = new Uint8Array(32)
  crypto.getRandomValues(challenge)
  try {
    await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [{ type: 'public-key', id: b64u.dec(credentialIdB64u) }],
        userVerification: 'required',
        timeout: 60000,
      },
    })
    return true
  } catch {
    return false
  }
}
