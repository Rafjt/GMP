<script setup>
import { computed,watch,ref } from 'vue';
import { useRouter } from 'vue-router';

const API_BASE_URL = "http://localhost:3001/auth";

const email = ref('');
const password = ref('');
const router = useRouter();
const errorMessage = ref('');
const successMessage = ref('');
const touchedFields = ref({ email: false, password: false });

watch(email, () => {
  touchedFields.value.email = true;
});

watch(password, () => {
  touchedFields.value.password = true;
});

const MissingFieldError = computed(() => {
  return (touchedFields.value.email && !email.value) || (touchedFields.value.password && !password.value) 
    ? "Please fill all login inputs" 
    : '';
});

watch(MissingFieldError, (newValue) => {
  errorMessage.value = newValue;
});

const login = async () => {
  if (email.value && password.value) {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.value, password: password.value }),
      });

      const data = await response.json();

      if (response.ok) {
        successMessage.value = "Login successful!";
        setTimeout(() => router.push("/welcome"), 2000);
      } else {
        errorMessage.value = data.error || "An error occurred.";
      }
    } catch (error) {
      console.error("Error:", error);
      errorMessage.value = "Unable to contact the server.";
    }
  } else {
    errorMessage.value = "Please fill all login inputs.";
  }
};
</script>

<template>
  <div class="bg-gray-800 p-8 rounded-lg shadow-lg w-96">
    <h2 class="text-2xl font-bold mb-6 text-center">Connexion</h2>
    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
    <form @submit.prevent="login">
      <div class="mb-4">
        <label for="email" class="block text-sm font-medium mb-1">Email</label>
        <input v-model="email" type="email" id="email" required class="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-blue-500">
      </div>
      <div class="mb-4">
        <label for="password" class="block text-sm font-medium mb-1">Mot de passe</label>
        <input v-model="password" type="password" id="password" required class="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-blue-500">
      </div>
      <button type="submit" class="button-2">Se connecter</button>
    </form>
  </div>
</template>

<style scoped src="@/assets/forms.css"></style>
