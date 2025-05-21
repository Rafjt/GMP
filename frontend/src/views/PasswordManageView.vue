<script setup>
import { ref } from 'vue'
import { createPassword } from '../functions/general'
import { useRouter } from 'vue-router'
import { encrypt } from "@/crypto/encryption";

const name = ref('')
const value = ref('')
const description = ref('')
const url = ref('')
const isLoading = ref(false)

const router = useRouter()

const initCreatePassword = async () => {
  isLoading.value = true

  const encrypted = await encrypt(value.value);
  const result = await createPassword(name.value, encrypted, description.value, url.value)

  if (result && !result.error) {
    // Optional: show success message or redirect
    setTimeout(() => router.push("/password"), 100);
  } else {
    console.error('Password creation failed:', result.error)
    isLoading.value = false
    // You could display an error message here
  }
}
</script>

<template>
    <div class="bg-gray-800 p-8 rounded-lg shadow-lg w-96">
      <h2 class="text-2xl font-bold mb-6 text-center">Create a new password</h2>
  
      <!-- <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
      <div v-if="successMessage" class="success-message">{{ successMessage }}</div> -->
  
      <form @submit.prevent="initCreatePassword">
        <div class="mb-4">
          <label for="name" class="block text-sm font-medium mb-1">Name</label>
          <input 
            v-model="name"
            type="name"
            id="name"
            required
            class="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <!-- <div v-if="emailError" class="customErrors">{{ emailError }}</div> -->
        </div>

        <div class="mb-4">
          <label for="value" class="block text-sm font-medium mb-1">Value</label>
          <input 
            v-model="value"
            type="value"
            id="value"
            required
            class="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <!-- <div v-if="emailError" class="customErrors">{{ emailError }}</div> -->
        </div>

        <div class="mb-4">
          <label for="description" class="block text-sm font-medium mb-1">Description</label>
          <input 
            v-model="description"
            type="description"
            id="description"
            class="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <!-- <div v-if="emailError" class="customErrors">{{ emailError }}</div> -->
        </div>

        <div class="mb-4">
          <label for="url" class="block text-sm font-medium mb-1">Url</label>
          <input 
            v-model="url"
            type="url"
            id="url"
            class="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <!-- <div v-if="emailError" class="customErrors">{{ emailError }}</div> -->
        </div>
        
  
        <button type="submit" class="button-2" :disabled="isLoading">
          {{ isLoading ? "Creation..." : "Create" }}
        </button>
      </form>
    </div>
  </template>

<style scoped src="@/assets/forms.css"></style>