<script setup>
import { ref } from 'vue'
import { sendResetEmail } from '@/functions/general'
import { isValidEmail } from '@/functions/FormValidation'

const email = ref('')
const errorMessage = ref('')

const handleSubmit = async () => {
  errorMessage.value = ''  // Reset error

  if (!email.value.trim()) {
    errorMessage.value = 'Please enter your email.'
    return
  }

  if (!isValidEmail(email.value)) {
    errorMessage.value = 'Invalid email format.';
    return;
  }

  try {
    const response = await sendResetEmail(email.value.trim())
    if (response.ok) {
      errorMessage.value = 'If this email exists, a reset link has been sent.'
    } else {
      const { error } = await response.json()
      errorMessage.value = error || 'Could not send email'
    }
  } catch (err) {
    console.error('Unexpected error:', err)
    errorMessage.value = 'An unexpected error occurred.'
  }
}
</script>

<template>
  <!-- Error Message -->
  <p v-if="errorMessage" class="customErrors mt-2">
      {{ errorMessage }}
  </p>
  <div class="container vh-100 d-flex justify-content-center align-items-center" style="flex-direction: column;">
    <div class="passg-container text-center">
      <h2><span class="emoji">📧</span> Enter your email</h2>
      <input
        v-model="email"
        type="email"
        class="old-new-password mb-3"
        placeholder="Email"
      />
      <button class="button-event w-100" @click="handleSubmit">
        Send me an email
      </button>
      <p class="deletion-warning small mt-3">
        ⚠️ This functionality enables you solely to delete your account along with all your passwords.
        This is a safety measure that protects your passwords against determined and skilled attackers.
      </p>
    </div>
  </div>
</template>

<style scoped src="@/assets/main.css"></style>
