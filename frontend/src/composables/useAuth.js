import { ref } from 'vue';
import { checkMe } from '../functions/check-me';

export const isAuthenticated = ref(false);

export async function refreshAuth() {
  try {
    const res = await checkMe();
    isAuthenticated.value = res.authenticated; // ici, on est sûr que c’est un booléen
  } catch (error) {
    console.error('Auth check failed:', error);
    isAuthenticated.value = false;
  }
}


export function useAuth() {
  return {
    isAuthenticated,
    refreshAuth
  }
}

