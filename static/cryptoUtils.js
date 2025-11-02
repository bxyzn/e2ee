// cryptoUtil.js
// AES-256-GCM encryption & decryption with PBKDF2-derived key

// --- helpers ---
const str2ab = str => new TextEncoder().encode(str).buffer;
const ab2b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const b642ab = b64 => Uint8Array.from(atob(b64), c => c.charCodeAt(0)).buffer;

// --- key derivation (PBKDF2 → AES-GCM key) ---
async function deriveKey(passphrase, salt) {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    str2ab(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 600000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// --- encrypt ---
window.encryptData = async function encryptData(passphrase, data) {
  const message = typeof data === "string" ? data : JSON.stringify(data);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(passphrase, salt);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    str2ab(message)
  );

  const packed = new Uint8Array(16 + 12 + encrypted.byteLength);
  packed.set(salt, 0);
  packed.set(iv, 16);
  packed.set(new Uint8Array(encrypted), 28);

  return ab2b64(packed);
}

// --- decrypt ---
window.decryptData = async function decryptData(passphrase, b64Ciphertext) {
  const data = b642ab(b64Ciphertext);

  const salt = data.slice(0, 16);
  const iv = data.slice(16, 28);
  const ct = data.slice(28);

  const key = await deriveKey(passphrase, salt);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ct
  );

  const text = new TextDecoder().decode(decrypted);

  try {
    return JSON.parse(text);
  } catch (e) {
    return text; // fallback if it wasn't JSON
  }
}
