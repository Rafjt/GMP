<script setup>
import { pullPassword, deletePassword, logout } from '../functions/general';
import { useRouter } from 'vue-router';
import { onMounted, ref } from 'vue';
import { decrypt } from '@/crypto/encryption';

const passwords = ref([]);
const visiblePasswords = ref({});
const router = useRouter();
const copiedStatus = ref({});

const copyToClipboard = async (id, text) => {
  try {
    await navigator.clipboard.writeText(text);
    copiedStatus.value[id] = true;


    setTimeout(() => {
      copiedStatus.value[id] = false;
    }, 1500);
  } catch (err) {
    console.error("Failed to copy to clipboard:", err);
  }
};



const handleDelete = async (id) => {
  console.log("deletion of", id);
  await deletePassword(id);
  passwords.value = passwords.value.filter(item => item.id !== id);
};

const toggleVisibility = (id) => {
  visiblePasswords.value[id] = !visiblePasswords.value[id];
};

onMounted(async () => {
  const data = await pullPassword();
  if (data?.error) return console.error(data.error);

  try {
    const decryptedPasswords = await Promise.all(
      data.map(async (item) => {
        const cipherText = item.value;
        try {
          const plainText = await decrypt(cipherText);
          return {
            ...item,
            value: plainText
          };
        } catch (err) {
          console.error(`Failed to decrypt password with id ${item.id}:`, err);
          if (err.message === "Key is missing.") {
            console.warn("Key is missing, logging out user.");
            logout();
            router.push('/login');
          }
          return {
            ...item,
            value: "[DECRYPTION FAILED]"
          };
        }
      })
    );

    passwords.value = decryptedPasswords;
  } catch (error) {
    console.error("Error decrypting passwords:", error);
  }
});
</script>



<template>
  <div class="main-container">
    <div class="password-list">

      <div class="search-add">
        <span class="text-gray-200">Search</span>
        <RouterLink to="/password-management" class="button">
          Add +
        </RouterLink>
      </div>


      <hr class="border-gray-400 mb-4" />


      <div class="pwd-elements">
        <div
          v-for="(item, index) in passwords"
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
            <button class="button">Edit</button>
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


  </style>
