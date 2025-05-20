<script setup>
import {pullPassword,deletePassword} from '../functions/general'
import { onMounted, ref, onUnmounted } from 'vue'

onMounted(async () => {
  const data = await pullPassword();
  passwords.value = data;
});

const handleDelete = async (id) => {
  console.log("deletion of", id)
  await deletePassword(id)
  passwords.value = passwords.value.filter(item => item.id !== id)
}


const passwords = ref([]);
</script>


<template>
    <div class="main-container">
      <div class="password-list">
        <!-- Top row: Search & Add -->
        <div class="search-add">
          <span class="text-gray-200">Search</span>
          <button class="text-blue-400 font-semibold hover:text-blue-600">Add +</button>
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
                <span>{{ item.name }}</span>
                <div class="pwd-buttons">
                    <button class="text-yellow-300 hover:text-yellow-500">Edit</button>
                    <button @click="handleDelete(item.id)" class="text-red-400 hover:text-red-600">Delete</button>
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

  </style>
  