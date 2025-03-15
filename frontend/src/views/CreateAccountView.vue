<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { isValidEmail, isValidPassword } from '../functions/FormValidation';

const email = ref('');
const password = ref('');
const touchedFields = ref({ email: false, password: false });
const router = useRouter();

// Computed validation errors (only show when the field has been touched)
const emailError = computed(() => {
  return touchedFields.value.email && !isValidEmail(email.value) ? "Invalid email" : '';
});

const passwordError = computed(() => {
  return touchedFields.value.password && !isValidPassword(password.value) ? "Invalid password" : '';
});

// Mark fields as touched on blur
const markAsTouched = (field) => {
  touchedFields.value[field] = true;
};

// Watch for changes and reset errors dynamically
watch(email, () => {
  if (touchedFields.value.email) touchedFields.value.email = false;
});

watch(password, () => {
  if (touchedFields.value.password) touchedFields.value.password = false;
});

const formvalidate = () => {
  touchedFields.value.email = true;
  touchedFields.value.password = true;

  if (!emailError.value && !passwordError.value) {
    router.push('/welcome');
    console.log("Valid email and password");
  }
};
</script>

<template>
  <div class="bg-gray-800 p-8 rounded-lg shadow-lg w-96">
    <h2 class="text-2xl font-bold mb-6 text-center">Create an account</h2>
    <form @submit.prevent="formvalidate">
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

      <button type="submit" class="button-2">Create</button>
    </form>
  </div>
</template>

<style 

scoped src="@/assets/forms.css">

</style>
