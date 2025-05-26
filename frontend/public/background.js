// // background.js
import { deriveKey } from './deriveKey.js';

let cachedKey = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'UNLOCK') {
    const { password, salt } = message;
    deriveKey(password, salt)
      .then(key => {
        cachedKey = key;
        console.log("LA CLÉ :",cachedKey)
        sendResponse({ success: true });
      })
      .catch(err => {
        console.error("Failed to derive key in background:", err);
        sendResponse({ success: false });
      });
    return true; // keep sendResponse async
  }

  if (message.type === 'LOCK') {
    cachedKey = null;
    sendResponse({ success: true });
  }

if (message && message.type === 'GET_KEY') {
  try {
    console.log("La clé est demandée");

    // Validate cachedKey presence
    if (!cachedKey) {
      console.warn("Clé introuvable en mémoire cache.");
      sendResponse({ success: false, error: "Encryption key not found in memory." });
    } else {
      console.log("clé envoyé", cachedKey)
      sendResponse({ success: true, key: cachedKey }); // directement l'objet JWK

    }

  } catch (err) {
    console.error("Erreur lors de la récupération de la clé :", err);
    sendResponse({ success: false, error: "Unexpected error while retrieving key." });
  }

  return true; // Ensure asynchronous response is allowed
}

    if (message.type === 'ENCRYPT') {
    const { plainText } = message;
    if (!cachedKey) {
      sendResponse({ success: false, error: "Key is missing." });
      return true;
    }

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder().encode(plainText);

    crypto.subtle.encrypt({ name: "AES-GCM", iv }, cachedKey, enc)
      .then(buffer => {
        const combined = new Uint8Array(iv.length + buffer.byteLength);
        combined.set(iv, 0);
        combined.set(new Uint8Array(buffer), iv.length);
        sendResponse({ success: true, cipher: btoa(String.fromCharCode(...combined)) });
      })
      .catch(error => {
        console.error("Encryption error:", error);
        sendResponse({ success: false, error: "Encryption failed" });
      });

    return true;
  }

  if (message.type === 'DECRYPT') {
    const { cipherText } = message;
    if (!cachedKey) {
      sendResponse({ success: false, error: "Key is missing." });
      return true;
    }

    try {
      const combined = Uint8Array.from(atob(cipherText), c => c.charCodeAt(0));
      const iv = combined.slice(0, 12);
      const data = combined.slice(12);

      crypto.subtle.decrypt({ name: "AES-GCM", iv }, cachedKey, data)
        .then(decrypted => {
          const text = new TextDecoder().decode(decrypted);
          sendResponse({ success: true, plainText: text });
        })
        .catch(error => {
          console.error("Decryption error:", error);
          sendResponse({ success: false, error: "Decryption failed" });
        });

    } catch (e) {
      console.error("Parsing error:", e);
      sendResponse({ success: false, error: "Invalid input" });
    }

    return true;
  }
});

console.log("Service worker loaded.");