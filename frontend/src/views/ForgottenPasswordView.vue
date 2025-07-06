<script setup>
import { ref } from 'vue'
import { sendResetEmail } from '@/functions/general'

const email = ref('')
const popupMessage = ref('')
const popupVisible = ref(false)

const showPopup = (message) => {
  popupMessage.value = message
  popupVisible.value = true
}

const handleSubmit = async () => {
  if (!email.value.trim()) {
    return showPopup("Please enter your email.")
  }

  try {
    const response = await sendResetEmail(email.value.trim())
    if (response.ok) {
      showPopup("If this email exists, a reset link has been sent.")
    } else {
      const { error } = await response.json()
      showPopup("Error: " + (error || "Could not send email"))
    }
  } catch (err) {
    console.error("Unexpected error:", err)
    showPopup("An unexpected error occurred.")
  }
}
</script>

<template>
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

    <div v-if="popupVisible" class="custom-popup">
      <div class="custom-popup-content">
        <span id="custom-popup-message">{{ popupMessage }}</span>
        <button class="popup-close-btn" @click="popupVisible = false">&times;</button>
      </div>
    </div>
  </div>
</template>


<style scoped src="@/assets/main.css"></style>
