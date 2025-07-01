<script setup>
import { ref } from 'vue'

const showPasswordFields = ref(false)
const oldPassword = ref('')
const newPassword = ref('')

const togglePasswordFields = () => {
  showPasswordFields.value = !showPasswordFields.value
}
</script>

<template>
  <div class="setting-container">
    <div class="password-change">
      <button class="button-event" @click="togglePasswordFields">
        {{ showPasswordFields ? 'Cancel' : 'Change master password' }}
      </button>

      <div v-if="showPasswordFields" class="mt-4 space-y-2">
        <label for="old-password" class="old-new-password-label">Old password</label>
        <input
          v-model="oldPassword"
          type="password"
          class="old-new-password"
        />
        <label for="new-password" class="old-new-password-label">New password</label>
        <input
          v-model="newPassword"
          type="password"
          class="old-new-password"
        />
      </div>
    </div>

    <div class="account-deletion mt-6">
      <button class="button-event-critical">DELETE YOUR ACCOUNT</button>
      <p class="deletion-warning">
        ⚠️ Deleting your account is a definitive action, but you will instantly be able to re-create another account with the same E-mail
      </p>
    </div>
  </div>
</template>

<style scoped src="@/assets/main.css"></style>
