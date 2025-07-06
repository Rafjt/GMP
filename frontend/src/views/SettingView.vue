<script setup>
import { ref, onMounted } from 'vue'
import { changeMasterPassword, deleteAccount, fetch2faStatusApi, toggle2faApi } from '../functions/general'
import { isValidPassword } from '../functions/FormValidation'
import { useRouter } from 'vue-router';
import QRCode from 'qrcode'

const qrCodeUrl = ref('')
const qrCodeDataUrl = ref('')
const router = useRouter();

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

// 2FA Logic
const twoFactorEnabled = ref(null)
const twoFaFeedback = ref('')

const fetch2faStatus = async () => {
  const result = await fetch2faStatusApi();
  if (result.error) {
    console.error("Error fetching 2FA status:", result.error);
    twoFactorEnabled.value = null;
  } else {
    twoFactorEnabled.value = result.enabled;
  }
}

const toggle2fa = async () => {
  const data = await toggle2faApi(twoFactorEnabled.value);
  if (data.success) {
    twoFaFeedback.value = data.message;
    await fetch2faStatus();
    if (data.otpauth_url) {
      qrCodeUrl.value = data.otpauth_url;
      qrCodeDataUrl.value = await QRCode.toDataURL(data.otpauth_url);
    } else {
      qrCodeUrl.value = '';
      qrCodeDataUrl.value = '';
    }
  } else {
    twoFaFeedback.value = data.error || 'Operation failed.';
  }
}

onMounted(() => {
  fetch2faStatus()
})

const handlechangeMasterPassword = async () => {
  if (!oldPassword.value || !newPassword.value) {
    feedbackMessage.value = 'Please fill in both fields.'
    isError.value = true
    return
  }

  if (!isValidPassword(newPassword.value)) {
    feedbackMessage.value = 'New password does not meet the required criteria.'
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

// Delete account logic
const confirmDelete = ref(false)
const deleteFeedback = ref('')
const isDeleteError = ref(false)

const showDeleteConfirmation = () => {
  confirmDelete.value = true
  deleteFeedback.value = ''
  isDeleteError.value = false
}

const cancelDelete = () => {
  confirmDelete.value = false
  deleteFeedback.value = ''
  isDeleteError.value = false
}

const handleDeleteAccount = async () => {
  try {
    const result = await deleteAccount()
    if (result.success) {
      deleteFeedback.value = result.message || 'Account deleted.'
      isDeleteError.value = false
      // Redirect to homepage after account deletion
      setTimeout(() => {
        router.push('/login');
      }, 1000)
    } else {
      deleteFeedback.value = result.error || 'Deletion failed.'
      isDeleteError.value = true
    }
  } catch (err) {
    deleteFeedback.value = 'Unexpected error.'
    isDeleteError.value = true
  }
}
</script>

<template>
  <div class="setting-container">

    <!-- 2FA Section -->
    <div class="2fa">
      <button 
        v-if="twoFactorEnabled !== null" 
        class="button-event" 
        @click="toggle2fa">
        {{ twoFactorEnabled === 1 ? 'Disable 2FA' : 'Enable 2FA' }}
      </button>
      <p v-else class="customErrors">Failed to load 2FA status.</p>
      <p v-if="twoFaFeedback" class="customEvent">{{ twoFaFeedback }}</p>
    </div>
    <div v-if="qrCodeDataUrl">
        <p style="color: white;">Scan this QR Code with your Authenticator app:</p>
        <img :src="qrCodeDataUrl" alt="2FA QR Code" class="qr-code" />
    </div>

    <!-- Change password -->
    <div class="password-change">
      <button class="button-event" @click="togglePasswordFields">
        {{ showPasswordFields ? 'Cancel' : 'Change master password' }}
      </button>

      <div v-if="showPasswordFields" class="mt-4 space-y-2">
        <label for="old-password" class="old-new-password-label">Old password</label>
        <input v-model="oldPassword" type="password" autocomplete="off" class="old-new-password" />

        <label for="new-password" class="old-new-password-label">New password</label>
        <input v-model="newPassword" type="password" autocomplete="off" class="old-new-password" />

        <button class="button-event mt-2" @click="handlechangeMasterPassword">
          Confirm change
        </button>

        <p v-if="feedbackMessage" :class="isError ? 'customErrors' : 'customEvent'">
          {{ feedbackMessage }}
        </p>
      </div>
    </div>

    <!-- Delete account -->
    <div class="account-deletion mt-6">
      <template v-if="confirmDelete">
        <p class="deletion-warning mb-2">⚠️ Do you really want to delete your account?</p>
        <div class="flex space-x-2">
          <button class="button-event-critical" @click="handleDeleteAccount">YES</button>
          <button class="button-event" @click="cancelDelete">NO</button>
        </div>
        <p v-if="deleteFeedback" :class="isDeleteError ? 'customErrors' : 'customEvent'">
          {{ deleteFeedback }}
        </p>
      </template>

      <template v-else>
        <button class="button-event-critical" @click="showDeleteConfirmation">
          DELETE YOUR ACCOUNT
        </button>
        <p class="deletion-warning">
          ⚠️ Deleting your account is a definitive action, but you will instantly be able to re-create another account with the same E-mail
        </p>
      </template>
    </div>
  </div>
</template>

<style scoped src="@/assets/main.css"></style>
