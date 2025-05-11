<script setup>
import { computed,watch,ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth'
import { API_AUTH_URL } from '../components/constant'
import { API_BASE_URL } from '../components/constant'
import { useEncryptionKey } from "@/composables/useEncryptionKey";
import { deriveKey } from "@/crypto/deriveKey"; // Your WebCrypto-based KDF function
const { refreshAuth } = useAuth();
const { setKey } = useEncryptionKey();


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
      const response = await fetch(`${API_AUTH_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ email: email.value, password: password.value }),
      });
      const salt_response = await fetch(`${API_BASE_URL}/get_salt`, {
        method: "GET",
        credentials: 'include',
      });

      const data = await response.json();
      const salt_data = await salt_response.json();
      console.log(salt_data);

      if (response.ok) {
        if (salt_response.ok){
          const salt = salt_data[0].salt;
          console.log("ici:",salt);
          const key = await deriveKey(password.value, salt);
          setKey(key);
          successMessage.value = "Login successful!";
          await refreshAuth()
          setTimeout(() => router.push("/welcome"), 500);
        }
      } else {
        errorMessage.value = data.message || "An error occurred.";
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
    <h2 class="text-2xl font-bold mb-6 text-center">Login</h2>
    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
    <form @submit.prevent="login">
      <div class="mb-4">
        <label for="email" class="block text-sm font-medium mb-1">Email</label>
        <input v-model="email" type="email" id="email" required class="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-blue-500">
      </div>
      <div class="mb-4">
        <label for="password" class="block text-sm font-medium mb-1">Password</label>
        <input v-model="password" type="password" id="password" required class="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-blue-500">
      </div>
      <button type="submit" class="button-2">Login</button>
    </form>
  </div>
</template>

<style scoped src="@/assets/forms.css"></style>
