<script setup>
import { computed,watch,ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth'
import { API_AUTH_URL } from '../components/constant'
import { API_BASE_URL } from '../components/constant'
const { refreshAuth } = useAuth();


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

// TODO: Mettre les fonction ci dessous dans un fichier functions ⌛
const login = async () => {
  if (email.value && password.value) {
    try {
      // Step 1: Attempt login
      const response = await fetch(`${API_AUTH_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.value, password: password.value })
      });

      const data = await response.json();

      if (!response.ok) {
        errorMessage.value = data.message || "Login failed.";
        return;
      }

      // Step 2: If login succeeded, get the salt
      const salt_response = await fetch(`${API_BASE_URL}/get_salt`, {
        method: 'GET',
        credentials: 'include'
      });

      const salt_data = await salt_response.json();

      if (!salt_response.ok || !salt_data[0]?.salt) {
        errorMessage.value = "Failed to retrieve salt.";
        return;
      }

      const salt = salt_data[0].salt;

      // Step 3: Send message to background to derive and store key
      console.log("GONNA CALL UNLOCK");
      chrome.runtime.sendMessage(
        { type: 'UNLOCK', password: password.value, salt },
        (res) => {
          if (chrome.runtime.lastError) {
            console.error("Runtime error:", chrome.runtime.lastError.message);
            errorMessage.value = "Background communication failed.";
          } else if (res.success) {
            console.log("Vault unlocked");
            router.push("/welcome");
          } else {
            errorMessage.value = "Key derivation failed.";
          }
        }
      );

    } catch (err) {
      errorMessage.value = "Server error.";
      console.error(err);
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
