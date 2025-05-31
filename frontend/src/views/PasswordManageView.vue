<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { createPassword, updatePassword, pullPassword } from '../functions/general'
import { encrypt, decrypt } from '@/crypto/encryption'

const name = ref('')
const value = ref('')
const description = ref('')
const url = ref('')
const isLoading = ref(false)

const router = useRouter()
const route = useRoute()

const mode = ref(route.query.mode || 'create')
const passwordId = ref(Number(route.query.id) || null)

onMounted(async () => {
  if (mode.value === 'edit' && passwordId.value) {
    const allPasswords = await pullPassword()
    console.log(allPasswords)
    const pwd = allPasswords.find(p => p.id === Number(passwordId.value))

    if (pwd) {
      try {
        const decryptedValue = await decrypt(pwd.value)
        name.value = pwd.name
        value.value = decryptedValue
        description.value = pwd.description || ''
        url.value = pwd.url || ''
      } catch (err) {
        console.error("Erreur de déchiffrement :", err)
      }
    } else {
      console.warn("Mot de passe non trouvé pour l'id :", passwordId.value)
    }
  }
})

const initCreatePassword = async () => {
  isLoading.value = true

  try {
    const encrypted = await encrypt(value.value)

    let result
    if (mode.value === 'edit') {
      result = await updatePassword(passwordId.value, name.value, encrypted, description.value, url.value)
    } else {
      result = await createPassword(name.value, encrypted, description.value, url.value)
    }

    if (result && !result.error) {
      setTimeout(() => router.push("/password"), 100)
    } else {
      console.error('Password save failed:', result.error)
    }
  } catch (err) {
    console.error("Erreur :", err)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="bg-gray-800 p-8 rounded-lg shadow-lg w-96">
    <h2 class="text-2xl font-bold mb-6 text-center">
      {{ mode === 'edit' ? 'Edit password' : 'Create a new password' }}
    </h2>

    <form @submit.prevent="initCreatePassword">
      <div class="mb-4">
        <label for="name" class="block text-sm font-medium mb-1">Name</label>
        <input 
          v-model="name"
          type="text"
          id="name"
          required
          class="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div class="mb-4">
        <label for="value" class="block text-sm font-medium mb-1">Value</label>
        <input 
          v-model="value"
          type="text"
          id="value"
          required
          class="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div class="mb-4">
        <label for="description" class="block text-sm font-medium mb-1">Description</label>
        <input 
          v-model="description"
          type="text"
          id="description"
          class="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div class="mb-4">
        <label for="url" class="block text-sm font-medium mb-1">URL</label>
        <input 
          v-model="url"
          type="text"
          id="url"
          class="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button type="submit" class="button-2" :disabled="isLoading">
        {{ isLoading ? (mode === 'edit' ? "Updating..." : "Creating...") : (mode === 'edit' ? "Update" : "Create") }}
      </button>
    </form>
  </div>
</template>

<style scoped src="@/assets/forms.css"></style>