<script setup>
import { ref } from 'vue'
import { changeMasterPassword } from '../functions/general'; // Update path as needed

const showPasswordFields = ref(false)
const oldPassword = ref('')
const newPassword = ref('')
const feedbackMessage = ref('')
const isError = ref(false)

const togglePasswordFields = () => {
  showPasswordFields.value = !showPasswordFields.value
  feedbackMessage.value = ''
  isError.value = false
  oldPassword.value = ''
  newPassword.value = ''
}

const handlechangeMasterPassword = async () => {
  if (!oldPassword.value || !newPassword.value) {
    feedbackMessage.value = 'Please fill in both fields.'
    isError.value = true
    return
  }

  const result = await changeMasterPassword(oldPassword.value, newPassword.value)

  if (result.success) {
    feedbackMessage.value = result.message || 'Password changed successfully.'
    isError.value = false
    showPasswordFields.value = false
    oldPassword.value = ''
    newPassword.value = ''
  } else {
    feedbackMessage.value = result.error || 'An error occurred.'
    isError.value = true
  }
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

        <button class="button-event mt-2" @click="handlechangeMasterPassword">
          Confirm change
        </button>

        <p v-if="feedbackMessage" :class="isError ? 'text-red-400' : 'text-green-400'">
          {{ feedbackMessage }}
        </p>
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
