<script setup>
import { RouterView, RouterLink } from 'vue-router'
import { onMounted, ref, onUnmounted } from 'vue'

const authState = ref(false);

const getAuthState = () => {
  chrome.storage.sync.get(['state'], function (result) {
    console.log('Retrieved value:', result.state);
    authState.value = result.state;
  });
};

onMounted(() => {
  getAuthState();

  // Listen to changes in chrome.storage
  chrome.storage.onChanged.addListener(handleStorageChange);
});

onUnmounted(() => {
  chrome.storage.onChanged.removeListener(handleStorageChange);
});

function handleStorageChange(changes, namespace) {
  if (namespace === "sync" && changes.state) {
    console.log("Storage changed: ", changes.state.newValue);
    authState.value = changes.state.newValue;
  }
}
</script>


<template>
  <h1>Welcome to RRPM !👋</h1>
  <header class="header-container">
    <div class="header-content">
      <nav v-if="authState">
        <RouterLink to="/password" class="login-link">Your passwords</RouterLink>
        <br>
        <RouterLink to="/password-generator" class="login-link">Password generator</RouterLink>
        <br>
        <RouterLink to="/logout" class="login-link">Logout</RouterLink>
      </nav>
      <nav v-else>
        <RouterLink to="/login" class="login-link">Login</RouterLink>
        <br>
        <RouterLink to="/create" class="login-link">Create an account</RouterLink>
      </nav>
    </div>
  </header>

  <main class="main-container">
    <RouterView />
  </main>
</template>



<style>
/* General Layout */
body {
  background: rgb(3,13,68);
  background: linear-gradient(130deg, rgba(3,13,68,1) 0%, rgba(122,58,0,1) 100%);
  width: 400px;
  height: 600px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

/* Header Styling */
.header-container {
  background-color: #ffffff4b;
  color: white;
  width: 100%;
  /* padding: 16px; */
  padding-bottom: 3vh;
  padding-top: 3vh;
  display: flex;
  justify-content: center;
  text-align: center;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  flex-direction: column; /* Stack elements vertically */
  align-items: center; /* Center horizontally */
  gap: 8px; /* Adds space between Welcome and Login */
}

/* Main Content Styling */
.main-container {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  text-align: center;
}

/* Typography */
h1 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #EEEEEE;
}

.login-link {
  font-size: 1.2rem;
  font-weight: 700;
  color: #EEEEEE;
  text-decoration: none;
}

.login-link:hover {
  text-decoration: underline;
}
</style>
