// 200 iterations + 256-bit server pepper (JWT_SECRET) keeps single hash ~1.2ms CPU
// and even double-hash (change-pin) ~2.5ms CPU — large safety margin under Cloudflare's 10ms limit.
const PBKDF2_ITERATIONS = 200;
const HASH_ALGO = "SHA-256";

export function generateSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashPin(pin: string, salt: string, pepper = ""): Promise<string> {
  const encoder = new TextEncoder();
  const input = pepper ? `${pin}:${pepper}` : pin;
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(input),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: HASH_ALGO,
    },
    keyMaterial,
    256
  );

  return Array.from(new Uint8Array(derivedBits), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
}

export async function verifyPin(
  pin: string,
  salt: string,
  hash: string,
  pepper = ""
): Promise<boolean> {
  const computed = await hashPin(pin, salt, pepper);
  if (computed.length !== hash.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ hash.charCodeAt(i);
  }
  return diff === 0;
}
