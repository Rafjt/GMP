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
  <div class="container d-flex justify-content-center align-items-center vh-100">
    <div class="card glassmorphism p-4 text-center">
      <h1 class="mb-3"><span class="emoji">📧</span> Enter your email</h1>
      <input
        v-model="email"
        type="email"
        class="form-control mb-3"
        placeholder="Email"
      />
      <button class="btn btn-dark w-100" @click="handleSubmit">Send me an email</button>
      <p class="text-warning small text-center mt-3">
        ⚠️ This functionality enables you solely to delete your account along with all your passwords.
        This is a safety measure that protects your passwords against determined and skilled attackers.
      </p>
      <router-link to="/" class="btn btn-outline-light w-100 mt-2">Back</router-link>
    </div>

    <div v-if="popupVisible" class="custom-popup">
      <div class="custom-popup-content">
        <span id="custom-popup-message">{{ popupMessage }}</span>
        <button class="popup-close-btn" @click="popupVisible = false">&times;</button>
      </div>
    </div>
  </div>
</template>


<style scoped>
.glassmorphism {
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  color: white;
}

.custom-popup {
  position: fixed;
  top: 10%;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(33, 33, 33, 0.95);
  color: #fff;
  padding: 1rem 1.5rem;
  border-radius: 10px;
  z-index: 1050;
  transition: opacity 0.3s ease-in-out;
}

.custom-popup-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.popup-close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
}
</style>
