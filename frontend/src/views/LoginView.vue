<script setup>
import { computed, watch, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import { loginUser, getSalt } from '@/functions/general';
import { isValidEmail, isValidPassword } from '@/functions/FormValidation';
import DOMPurify from 'dompurify';

const { refreshAuth } = useAuth();
const email = ref('');
const password = ref('');
const router = useRouter();
const errorMessage = ref('');
const successMessage = ref('');
const isSubmitting = ref(false);
const touchedFields = ref({ email: false, password: false });

// Fonction de nettoyage centralisée
const safeMessage = (msg) => DOMPurify.sanitize(msg || "Unexpected error");

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
  errorMessage.value = ''; // reset previous errors

  if (!isValidEmail(email.value)) {
    errorMessage.value = safeMessage("Invalid email format.");
    return;
  }

  if (!isValidPassword(password.value)) {
    errorMessage.value = safeMessage("Invalid password.");
    return;
  }

  isSubmitting.value = true;

  try {
    const loginResponse = await loginUser(email.value, password.value);
    if (loginResponse.error) {
      errorMessage.value = safeMessage(loginResponse.error);
      return;
    }

    const saltResponse = await getSalt();
    if (saltResponse.error) {
      errorMessage.value = safeMessage(saltResponse.error);
      return;
    }

    const salt = saltResponse.salt;

    console.log("GONNA CALL UNLOCK");
    chrome.runtime.sendMessage(
      { type: 'UNLOCK', password: password.value, salt },
      (res) => {
        if (chrome.runtime.lastError) {
          console.error("Runtime error:", chrome.runtime.lastError.message);
          errorMessage.value = safeMessage("Background communication failed.");
        } else if (res.success) {
          console.log("Vault unlocked");
          router.push("/welcome");
        } else {
          errorMessage.value = safeMessage("Key derivation failed.");
        }
      }
    );
  } catch (err) {
    console.error(err);
    errorMessage.value = safeMessage("Server error.");
  } finally {
    isSubmitting.value = false;
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
        <input
          v-model="email"
          type="email"
          id="email"
          required
          class="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div class="mb-4">
        <label for="password" class="block text-sm font-medium mb-1">Password</label>
        <input
          v-model="password"
          type="password"
          id="password"
          required
          class="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        class="button-2 w-full"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? "Logging in..." : "Login" }}
      </button>
    </form>
  </div>
</template>

<style scoped src="@/assets/forms.css"></style>
