// useAuth.js
import { ref, watchEffect } from 'vue';
import { checkMe } from '../functions/check-me';

export const isAuthenticated = ref(false);

export async function refreshAuth() {
  try {
    const res = await checkMe();
    isAuthenticated.value = res?.authenticated ?? false;
    // Écris dans chrome.storage (pour synchro entre onglets/extensions)
    chrome.storage.sync.set({ state: isAuthenticated.value });
  } catch (error) {
    console.error('Auth check failed:', error);
    isAuthenticated.value = false;
  }
}

// Optionnel : écoute les changements Chrome.storage si d'autres onglets modifient
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.state) {
    isAuthenticated.value = changes.state.newValue;
  }
});

export function useAuth() {
  return {
    isAuthenticated,
    refreshAuth
  }
}
