export async function encrypt(plainText: string): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: 'ENCRYPT', plainText }, (res) => {
      if (res?.success) {
        resolve(res.cipher);
      } else {
        reject(new Error(res?.error || "Encryption failed"));
      }
    });
  });
}

export async function decrypt(cipherText: string): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: 'DECRYPT', cipherText }, (res) => {
      if (res?.success) {
        resolve(res.plainText);
      } else {
        reject(new Error(res?.error || "Decryption failed"));
      }
    });
  });
}
