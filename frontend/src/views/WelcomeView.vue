<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const logout = () => {
  router.push('/');
};
</script>

<template>
  <div class="text-center">
    <h1 class="text-3xl font-bold">Bienvenue ! 🎉</h1>
    <p class="mt-4">Vous êtes connecté.</p>
    <button @click="logout" class="mt-4 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded">Déconnexion</button>
  </div>
</template>
