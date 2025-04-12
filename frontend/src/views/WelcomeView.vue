<script setup>
import { useRouter } from 'vue-router';
import { logout as performLogout } from '../functions/general'; // Rename the imported logout function to avoid conflict

const router = useRouter();

const handleLogout = async () => {
  await performLogout(); // Call the imported logout function
  router.push('/login'); // Redirect to the login page or home after logout
};
</script>

<template>
  <div class="text-center">
    <h1 class="text-3xl font-bold">Bienvenue ! 🎉</h1>
    <p class="mt-4">Vous êtes connecté.</p>
    <button @click="handleLogout" class="mt-4 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded">Déconnexion</button>
  </div>
</template>