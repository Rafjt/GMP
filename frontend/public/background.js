import { deriveKey } from './deriveKey.js';

let cachedKey = null;

const VALID_MESSAGE_TYPES = ['UNLOCK', 'LOCK', 'GET_KEY', 'ENCRYPT', 'DECRYPT'];

function isValidSender(sender) {
  return sender && sender.id === chrome.runtime.id;
}

function isValidMessage(message) {
  return message && typeof message === 'object' && VALID_MESSAGE_TYPES.includes(message.type);
}

function respond(sendResponse, success, payload = {}) {
  sendResponse({ success, ...payload });
}

async function getNonceCounter() {
  const key = 'aes-gcm-nonce-counter';
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      let value = parseInt(result[key], 10);
      if (isNaN(value)) value = 0;
      const next = value + 1;
      chrome.storage.local.set({ [key]: next }, () => resolve(value));
    });
  });
}


function generateDeterministicIV(counter) {
  const iv = new Uint8Array(12); // 96 bits
  const view = new DataView(iv.buffer);
  view.setUint32(8, counter); // utilise les 4 derniers octets comme compteur
  return iv;
}


//Handler UNLOCK
async function handleUnlock(message, sendResponse) {
  const { password, salt } = message;
  try {
    const key = await deriveKey(password, salt);
    cachedKey = key;
    respond(sendResponse, true);
  } catch (err) {
    console.error("Error when deriving key:", err);
    respond(sendResponse, false, { error: "Key derivation failed" });
  }
}

//Handler LOCK
function handleLock(sendResponse) {
  cachedKey = null;
  respond(sendResponse, true);
}

//Handler GET_KEY
function handleGetKey(sendResponse) {
  if (!cachedKey) {
    console.warn("Key not found");
    return respond(sendResponse, false, { error: "Encryption key not found in memory." });
  }

  respond(sendResponse, true, { key: cachedKey });
}

// Handler ENCRYPT modifié
async function handleEncrypt(message, sendResponse) {
  if (!cachedKey) {
    return respond(sendResponse, false, { error: "Key is missing." });
  }

  try {
    const counter = await getNonceCounter();
    const iv = generateDeterministicIV(counter);
    const enc = new TextEncoder().encode(message.plainText);

    const buffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      cachedKey,
      enc
    );

    const combined = new Uint8Array(iv.length + buffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(buffer), iv.length);

    const cipher = btoa(String.fromCharCode(...combined));
    respond(sendResponse, true, { cipher });
  } catch (error) {
    console.error("Encryption error: ", error);
    respond(sendResponse, false, { error: "Encryption failed" });
  }
}

//Handler DECRYPT
async function handleDecrypt(message, sendResponse) {
  if (!cachedKey) {
    return respond(sendResponse, false, { error: "Key is missing." });
  }

  try {

    const combined = Uint8Array.from(atob(message.cipherText), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, cachedKey, data);
    const text = new TextDecoder().decode(decrypted);

    respond(sendResponse, true, { plainText: text });
  } catch (error) {
    console.error("Decryption error:", error);
    respond(sendResponse, false, { error: "Decryption failed" });
  }
}

//Dispatcher des calls
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!isValidSender(sender)) {
    console.warn("Unauthorized sender: ", sender);
    respond(sendResponse, false, { error: "Unauthorized sender" });
    return; // No need to keep port open
  }

  if (!isValidMessage(message)) {
    console.warn("Invalid message format :", message);
    respond(sendResponse, false, { error: "Invalid message format" });
    return; // No need to keep port open
  }

  switch (message.type) {
    case 'UNLOCK':
      handleUnlock(message, sendResponse);
      return true; // ✅ Keep message channel open for async response

    case 'LOCK':
      handleLock(sendResponse);
      return false;

    case 'GET_KEY':
      handleGetKey(sendResponse);
      return false;

    case 'ENCRYPT':
      handleEncrypt(message, sendResponse);
      return true; // ✅

    case 'DECRYPT':
      handleDecrypt(message, sendResponse);
      return true; // ✅

    default:
      respond(sendResponse, false, { error: "Unknown message type" });
      return false;
  }
});
