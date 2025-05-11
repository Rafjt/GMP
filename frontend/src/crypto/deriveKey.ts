export async function deriveKey(password: string, salt: string): Promise<CryptoKey> {
    const enc = new TextEncoder();
  
    // 1. Convert password to key material
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );
  
    // 2. Derive a key using PBKDF2 + SHA-256
    const key = await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: enc.encode(salt),
        iterations: 100_000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      true, // extractable (can be false if you want extra safety)
      ["encrypt", "decrypt"]
    );
  
    return key;
  }
  