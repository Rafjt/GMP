<script setup>
import { pullPassword, deletePassword, logout } from '../functions/general';
import { useRouter } from 'vue-router';
import { onMounted, ref, computed } from 'vue';
import { decrypt } from '@/crypto/encryption';
import DOMPurify from 'dompurify';

const searchQuery = ref('');
const passwords = ref([]);
const visiblePasswords = ref({});
const copiedStatus = ref({});
const autoHideTimers = new Map();
const errorMessage = ref('');
const router = useRouter();

const copyToClipboard = async (id, text) => {
  try {
    await navigator.clipboard.writeText(text);
    copiedStatus.value[id] = true;

    // Supprime le mot de passe de l'état après copie
    const item = passwords.value.find(p => p.id === id);
    if (item) item.value = 'Copied!';

    setTimeout(() => {
      copiedStatus.value[id] = false;
    }, 1500);
  } catch (err) {
    console.error("Failed to copy to clipboard:", err);
    errorMessage.value = DOMPurify.sanitize("Failed to copy to clipboard");
  }
};

const handleDelete = async (id) => {
  await deletePassword(id);
  passwords.value = passwords.value.filter(item => item.id !== id);
};

const toggleVisibility = (id) => {
  visiblePasswords.value[id] = !visiblePasswords.value[id];

  // Si on affiche, on cache automatiquement après 10 secondes
  if (visiblePasswords.value[id]) {
    clearTimeout(autoHideTimers.get(id));
    const timer = setTimeout(() => {
      visiblePasswords.value[id] = false;
    }, 10000);
    autoHideTimers.set(id, timer);
  }
};

const filteredPasswords = computed(() =>
  passwords.value.filter(item =>
    item.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
);

onMounted(async () => {
  const data = await pullPassword();
  if (data?.error) {
    errorMessage.value = DOMPurify.sanitize("Error when loading passwords");
    return console.error(data.error);
  }

  try {
    const decryptedPasswords = await Promise.all(
      data.map(async (item) => {
        try {
          const plainText = await decrypt(item.value);
          return { ...item, value: plainText };
        } catch (err) {
          console.error(`Failed to decrypt password ${item.id}:`, err);
          if (err.message === "Key is missing.") {
            logout();
            router.push('/login');
          }
          return { ...item, value: "[DECRYPTION FAILED]" };
        }
      })
    );

    passwords.value = decryptedPasswords;
  } catch (error) {
    console.error("Error decrypting passwords:", error);
    errorMessage.value = DOMPurify.sanitize("An error occurred while decrypting passwords.");
  }
});
</script>

<template>
  <div class="main-container">
    <div class="password-list">

      <div v-if="errorMessage" class="customErrors mb-4">
        {{ errorMessage }}
      </div>

      <div class="search-add">
        <input
          v-model="searchQuery"
          placeholder="Search by name"
          class="search-input"
          id="add-btn"
        />
        <RouterLink to="/password-management" class="button">
          Add +
        </RouterLink>
      </div>



      <hr class="border-gray-400 mb-4" />


      <div class="pwd-elements">
        <div
          v-for="(item, index) in filteredPasswords"
          :key="item.id"
          class="test"
        >
          <text class="pwd-name">{{ item.name }}</text>

          <span
            class="pwd-value"
            v-if="visiblePasswords[item.id]"
            @click="copyToClipboard(item.id, item.value)"
            style="cursor: pointer;"
            :title="'Click to copy'"
          >
            <template v-if="copiedStatus[item.id]">
              ✅ Copied!
            </template>
            <template v-else>
              {{ item.value.length > 12 ? item.value.slice(0, 12) + '…' : item.value }}
            </template>
          </span>

          <span v-else class="pwd-value">
            {{ '•'.repeat(Math.min(item.value.length, 12)) + (item.value.length > 12 ? '…' : '') }}
          </span>

          <button @click="toggleVisibility(item.id)" class="button">
            {{ visiblePasswords[item.id] ? 'Hide' : 'Show' }}
          </button>

          <div class="pwd-buttons">
            <button
              @click="() => router.push({ path: '/password-management', query: { mode: 'edit', id: item.id } })"
              class="button"
            >
              Edit
            </button>
            <button @click="handleDelete(item.id)" class="button">Delete</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


  
  <style>
  .main-container {
    width: 100%;
    overflow-x: hidden; /* empêche l’élargissement horizontal */
  }
  
  .password-list {
    width: 100%;
  }
  
  .pwd-elements {
    box-sizing: border-box;
    overflow-y: auto;
    max-height: 400px;
    width: 100%;
  }
  
  .test {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: rgba(255, 255, 255, 0.1);
    padding: 1rem;
    margin-bottom: 0.5rem;
    border-radius: 0.5rem;
    color: white;
  }
  
  .pwd-buttons {
    display: flex;
    gap: 1rem;
  }

  .search-add {
    display: flex;
    justify-content: flex-end;
    justify-content: space-between;
  }

.password-list {
  padding-top: 3%;
  width: 90%; /* ou 100%, selon besoin */
  max-width: unset;
  text-align: left; /* annule l'héritage du centrage */
  margin: 0 auto; /* recentre avec une largeur définie */
  color: white;
  float: none;
  overflow: hidden;
}

.button {
  background-color:#efefef87;
  /* padding: 2% 3%; */
  color: black;
  border-radius: 10%;
  border-width: 0;
  text-decoration: none;
  cursor: pointer;
}

.pwd-name {
  font-weight: bold;
}

.pwd-value {
  transition: color 0.3s ease;
}

/* .search-input {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: none;
  outline: none;
  font-size: 1rem;
  background-color: #efefef87;
  color: black;
  margin-right: 1rem;
} */

#add-btn {
  background-color: transparent;
  color:white;
  border:unset;
}

.customErrors {
  color: #f87171; /* rouge clair */
  background-color: rgba(255, 0, 0, 0.1);
  padding: 0.5rem;
  border-radius: 0.5rem;
}

.pwd-value {
  transition: color 0.3s ease;
  user-select: none; /* Empêche la sélection par l'utilisateur */
  pointer-events: auto;
}

  </style>
