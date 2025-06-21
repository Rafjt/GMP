<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import bcrypt from 'bcryptjs';
import { API_AUTH_URL } from "../components/constant.js";
import { isValidEmail, isValidPassword } from '../functions/FormValidation';
import DOMPurify from 'dompurify';


const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const passwordStrength = ref(0);
const touchedFields = ref({ email: false, password: false, confirmPassword: false });
const errorMessage = ref('');
const successMessage = ref('');
const isLoading = ref(false);
const router = useRouter();

function getPasswordStrength(pw) {
  let score = 0;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(pw)) score++;
  return score;
}

watch(password, (newVal) => {
  passwordStrength.value = getPasswordStrength(newVal);
  if (touchedFields.value.password) touchedFields.value.password = false;
  errorMessage.value = "";
});

watch(email, () => {
  if (touchedFields.value.email) touchedFields.value.email = false;
  errorMessage.value = "";
});

watch(confirmPassword, () => {
  if (touchedFields.value.confirmPassword) touchedFields.value.confirmPassword = false;
  errorMessage.value = "";
});

const emailError = computed(() => touchedFields.value.email && !isValidEmail(email.value) ? "Invalid email" : '');
const passwordError = computed(() => touchedFields.value.password && !isValidPassword(password.value) ? "Invalid password" : '');
const confirmPasswordError = computed(() => touchedFields.value.confirmPassword && confirmPassword.value !== password.value ? "Passwords do not match" : '');

const markAsTouched = (field) => {
  touchedFields.value[field] = true;
};

const registerUser = async () => {
  touchedFields.value.email = true;
  touchedFields.value.password = true;
  touchedFields.value.confirmPassword = true;

  if (emailError.value || passwordError.value || confirmPasswordError.value) return;

  isLoading.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  const hashedPassword = await bcrypt.hash(password.value, 10);

  try {
    const response = await fetch(`${API_AUTH_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.value,
        password: hashedPassword,
        // recaptchaToken: await grecaptcha.execute('YOUR_RECAPTCHA_SITE_KEY', { action: 'register' })
      })
    });

    if (!response.ok) {
      const err = await response.json();
      errorMessage.value = err.error || "An error occurred.";
      return;
    }

    successMessage.value = DOMPurify.sanitize("Registration succeeded! Please verify your email.");
    setTimeout(() => router.push("/"), 2000);
  } catch (error) {
    console.error("Error:", error);
    errorMessage.value = DOMPurify.sanitize("Unable to contact the server.");
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="bg-gray-800 p-8 rounded-lg shadow-lg w-96">
    <h2 class="text-2xl font-bold mb-6 text-center">Create an account</h2>

    <p class="pwd-reqiurements">Your password must be at least 12 characters long and include at least one uppercase letter, one lowercase letter, one number, and one symbol.</p>

    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    <div v-if="successMessage" class="success-message">{{ successMessage }}</div>

    <form @submit.prevent="registerUser">
      <div class="mb-4">
        <label for="email" class="block text-sm font-medium mb-1">Email</label>
        <input 
          v-model="email" 
          @blur="markAsTouched('email')" 
          type="email" 
          id="email" 
          required 
          class="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
        />
        <div v-if="emailError" class="customErrors">{{ emailError }}</div>
      </div>

      <div class="mb-4">
        <label for="password" class="block text-sm font-medium mb-1">Password</label>
        <input 
          v-model="password" 
          @blur="markAsTouched('password')" 
          type="password" 
          id="password" 
          required 
          class="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
        />
        <div v-if="passwordError" class="customErrors">{{ passwordError }}</div>
        <div class="mt-1 text-xs text-gray-300 strength">Strength: {{ passwordStrength }}/5</div>
      </div>

      <div class="mb-4">
        <label for="confirmPassword" class="block text-sm font-medium mb-1">Confirm password</label>
        <input 
          v-model="confirmPassword" 
          @blur="markAsTouched('confirmPassword')" 
          type="password" 
          id="confirmPassword" 
          required 
          class="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
        />
        <div v-if="confirmPasswordError" class="customErrors">{{ confirmPasswordError }}</div>
      </div>

      <button type="submit" class="button-2" :disabled="isLoading">
        {{ isLoading ? "Creating..." : "Create" }}
      </button>
    </form>
  </div>
</template>

<style scoped src="@/assets/forms.css"></style>

<!-- à rajouter à index.html -->
<!-- <script src="https://www.google.com/recaptcha/api.js?render=YOUR_RECAPTCHA_SITE_KEY"></script> -->
