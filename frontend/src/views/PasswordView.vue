<script setup>
import { pullPassword, deletePassword } from '../functions/general';
import { onMounted, ref } from 'vue';
import { decrypt } from '@/crypto/encryption'; // ✅ import the reusable decrypt()

const passwords = ref([]);

const handleDelete = async (id) => {
  console.log("deletion of", id);
  await deletePassword(id);
  passwords.value = passwords.value.filter(item => item.id !== id);
};

onMounted(async () => {
  const data = await pullPassword();
  if (data?.error) return console.error(data.error);

  try {
    const decryptedPasswords = await Promise.all(
      data.map(async (item) => {
        const cipherText = item.value; // Assuming the encrypted string is here
        try {
          const plainText = await decrypt(cipherText); // ✅ Use background decrypt
          return {
            ...item,
            value: plainText
          };
        } catch (err) {
          console.error(`Failed to decrypt password with id ${item.id}:`, err);
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
        <!-- Top row: Search & Add -->
        <div class="search-add">
          <span class="text-gray-200">Search</span>
          <RouterLink to="/password-management" class="button">
            Add +
          </RouterLink>
        </div>

  
        <!-- Divider -->
        <hr class="border-gray-400 mb-4" />
  
        <!-- Password List (scrollable and full width without overflow) -->
        <div class="pwd-elements">
            <div
                v-for="(item, index) in passwords"
                :key="item.id"
                class="test"
                >
                <span>{{ item.value }}</span>
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
  padding: 2% 3%;
  color: black;
  border-radius: 10%;
  border-width: 0;
  text-decoration: none;
  cursor: pointer;
}


  </style>
