import { ref } from "vue";

const derivedKey = ref<CryptoKey | null>(null);

export function useEncryptionKey() {
  function setKey(key: CryptoKey) {
    derivedKey.value = key;
  }

  function clearKey() {
    derivedKey.value = null;
  }

  return {
    derivedKey,
    setKey,
    clearKey
  };
}
