<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { isValidEmail, isValidPassword } from '../functions/FormValidation';
import bcrypt from 'bcryptjs';

const API_BASE_URL = "http://localhost:3001/auth";

const email = ref('');
const password = ref('');
const touchedFields = ref({ email: false, password: false });
const errorMessage = ref('');
const successMessage = ref('');
const isLoading = ref(false);
const router = useRouter();

// Vérifications des erreurs (s'affichent après blur)
const emailError = computed(() => {
  return touchedFields.value.email && !isValidEmail(email.value) ? "Email invalide" : '';
});

const passwordError = computed(() => {
  return touchedFields.value.password && !isValidPassword(password.value) ? "Mot de passe invalide" : '';
});

// Marque un champ comme touché après blur
const markAsTouched = (field) => {
  touchedFields.value[field] = true;
};

// Supprime les erreurs dès que l'utilisateur tape
watch(email, () => {
  if (touchedFields.value.email) touchedFields.value.email = false;
  errorMessage.value = ""; // Reset erreur API
});

watch(password, () => {
  if (touchedFields.value.password) touchedFields.value.password = false;
  errorMessage.value = ""; // Reset erreur API
});

const registerUser = async () => {
  touchedFields.value.email = true;
  touchedFields.value.password = true;

  if (emailError.value || passwordError.value) return;

  isLoading.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  console.log("le password:",password.value);
  const hashedPassword = await bcrypt.hash(password.value, 10);
  console.log("le password hashé:",hashedPassword);

  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.value, password: hashedPassword }),
    });

    const data = await response.json();

    if (response.ok) {
      successMessage.value = "Inscription réussie ! Vérifiez votre email.";
      setTimeout(() => router.push("/"), 2000);
    } else {
      errorMessage.value = data.error || "Une erreur est survenue.";
    }
  } catch (error) {
    console.error("Erreur:", error);
    errorMessage.value = "Impossible de contacter le serveur.";
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="bg-gray-800 p-8 rounded-lg shadow-lg w-96">
    <h2 class="text-2xl font-bold mb-6 text-center">Créer un compte</h2>

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
        <label for="password" class="block text-sm font-medium mb-1">Mot de passe</label>
        <input 
          v-model="password" 
          @blur="markAsTouched('password')" 
          type="password" 
          id="password" 
          required 
          class="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
        />
        <div v-if="passwordError" class="customErrors">{{ passwordError }}</div>
      </div>

      <button type="submit" class="button-2" :disabled="isLoading">
        {{ isLoading ? "Création..." : "Créer un compte" }}
      </button>
    </form>
  </div>
</template>

<style 

scoped src="@/assets/forms.css">

</style>
