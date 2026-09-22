// ─────────────────────────────────────────────────────────────────
// totp.js — RFC 6238 TOTP (Google Authenticator compatible) in pure
// JS on top of Web Crypto. No dependency needed: HMAC-SHA1 comes
// from crypto.subtle, base32 decoding is hand-rolled.
// Used by Settings → Security → Two-factor authentication.
// ─────────────────────────────────────────────────────────────────

const B32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

/** Base32 (RFC 4648) → Uint8Array. Accepts padded or unpadded input. */
export function base32Decode(input) {
  const clean = String(input || '').toUpperCase().replace(/[\s-]/g, '').replace(/=+$/, '')
  let bits = 0
  let value = 0
  const out = []
  for (const ch of clean) {
    const idx = B32_ALPHABET.indexOf(ch)
    if (idx === -1) continue
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return new Uint8Array(out)
}

/** Random secret, base32 — 20 bytes = 160 bits (Recommended by RFC 4226). */
export function generateTotpSecret() {
  const bytes = new Uint8Array(20)
  crypto.getRandomValues(bytes)
  let bits = 0
  let value = 0
  let out = ''
  for (const b of bytes) {
    value = (value << 8) | b
    bits += 8
    while (bits >= 5) {
      out += B32_ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) out += B32_ALPHABET[(value << (5 - bits)) & 31]
  return out
}

async function hmacSha1(keyBytes, msgBytes) {
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes.buffer.slice(keyBytes.byteOffset, keyBytes.byteOffset + keyBytes.byteLength),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, msgBytes)
  return new Uint8Array(sig)
}

/** Current 6-digit TOTP code for a base32 secret at a given time. */
export async function totpCode(secretB32, { digits = 6, period = 30, atMs = Date.now() } = {}) {
  const key = base32Decode(secretB32)
  const counter = Math.floor(atMs / 1000 / period)
  const msg = new Uint8Array(8)
  // Big-endian 64-bit counter (split for numbers > 2^31 safety)
  let c = counter
  for (let i = 7; i >= 0; i -= 1) {
    msg[i] = c & 0xff
    c = Math.floor(c / 256)
  }
  const h = await hmacSha1(key, msg)
  const offset = h[h.length - 1] & 0x0f
  const bin =
    ((h[offset] & 0x7f) << 24) |
    ((h[offset + 1] & 0xff) << 16) |
    ((h[offset + 2] & 0xff) << 8) |
    (h[offset + 3] & 0xff)
  return String(bin % 10 ** digits).padStart(digits, '0')
}

/**
 * Verify a user-entered code. Allows ±1 time-step of clock drift
 * (≈ 30 s each side), which is what authenticator apps expect.
 */
export async function verifyTotp(secretB32, code) {
  const clean = String(code || '').replace(/\D/g, '')
  if (clean.length !== 6) return false
  const now = Date.now()
  for (const drift of [0, -30000, 30000]) {
    // eslint-disable-next-line no-await-in-loop
    if ((await totpCode(secretB32, { atMs: now + drift })) === clean) return true
  }
  return false
}

/** Seconds until the current code rotates — for the countdown UI. */
export function totpSecondsLeft(period = 30) {
  return period - Math.floor((Date.now() / 1000) % period)
}

/** otpauth:// URI for QR codes (qrcode lib already in the app). */
export function totpUri(secretB32, { account = 'owner', issuer = 'Marble Manager' } = {}) {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secretB32}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`
}
