// crypto/encryption.ts
import { useEncryptionKey } from "@/composables/useEncryptionKey";

export async function encrypt(plainText: string): Promise<string> {
  const { derivedKey } = useEncryptionKey();

  if (!derivedKey.value) {
    throw new Error("Encryption key not available");
  }

  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV

  const cipherBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    derivedKey.value,
    enc.encode(plainText)
  );

  // Prepend IV to ciphertext
  const combined = new Uint8Array(iv.length + cipherBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipherBuffer), iv.length);

  // Convert to base64
  return btoa(String.fromCharCode(...combined));
}

  
// crypto/encryption.ts
export async function decrypt(cipherTextBase64: string): Promise<string> {
    const { derivedKey } = useEncryptionKey();
  
    if (!derivedKey.value) {
      throw new Error("Encryption key not available");
    }
  
    const encryptedBytes = Uint8Array.from(atob(cipherTextBase64), c => c.charCodeAt(0));
    const iv = encryptedBytes.slice(0, 12);
    const data = encryptedBytes.slice(12);
  
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      derivedKey.value,
      data
    );
  
    return new TextDecoder().decode(decryptedBuffer);
  }
  