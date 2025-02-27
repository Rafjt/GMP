<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header class="bg-gray-900 text-white p-4 flex items-center justify-between shadow-md">
    <div id="first1" class="flex items-center space-x-4">
      <h1>Welcome to RRPM !👋</h1>
      <nav>
        <RouterLink to="/" class="logo">
         <h1>Login</h1>
        </RouterLink>
      </nav>
    </div>
  </header>

  <main class="min-h-screen bg-gray-900 text-white flex items-center justify-center">
    <RouterView />
  </main>
</template>

<style>
body {
  background-color: #021526;
}

h1 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #EEEEEE;
}

h2 {
  color: #EEEEEE;
}
</style>