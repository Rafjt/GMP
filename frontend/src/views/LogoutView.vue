<script setup>
import { useRouter } from 'vue-router';
import { logout as performLogout } from '../functions/general'; // Rename the imported logout function to avoid conflict

const router = useRouter();

const handleLogout = async () => {
    chrome.runtime.sendMessage({ type: 'LOCK' }, () => {
    console.log("Vault locked");
  });

  await performLogout(); // Call the imported logout function
  router.push('/login'); // Redirect to the login page or home after logout
};
</script>

<template>
  <div class="text-center">
    <h1 class="text-3xl font-bold">Do you really want to logout ?</h1>
    <br>
    <button @click="handleLogout" class="button-event">Logout</button>
  </div>
</template>

<style scoped src="@/assets/main.css"></style>