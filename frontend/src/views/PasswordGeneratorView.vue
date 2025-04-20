<script>
import { generatePassword } from '@/functions/general';

export default {
  data() {
    return {
      length: 35,
      useSymbols: false,
      useNumbers: false,
      password: '',
      isCopied: false
    }
  },
  watch: {
    length: 'updatePassword',
    useSymbols: 'updatePassword',
    useNumbers: 'updatePassword'
  },
  methods: {
    updatePassword() {
      this.password = generatePassword(this.length, this.useNumbers, this.useSymbols);
    },
    async copyPassword() {
      try {
        await navigator.clipboard.writeText(this.password);
        this.isCopied = true;
        setTimeout(() => {
          this.isCopied = false;
        }, 2000);
      } catch (e) {
        // Optionally handle errors here
      }
    }
  },
  mounted() {
    this.updatePassword(); // Generate initial password
  }
}
</script>


<template>
    <div class="passg-container">
      <div class="passg-parameters">
        <div class="passg-lenght">
          <h2>Password length</h2>
          <input
            type="range"
            min="12"
            max="100"
            v-model="length"
            class="slider"
            id="myRange"
            @input="updatePassword"
          >
          <span>{{ length }}</span>
        </div>
        <div class="passg-options">
          <h2>Symbols</h2>
          <input type="checkbox" v-model="useSymbols" @change="updatePassword">
          <h2>Numbers</h2>
          <input type="checkbox" v-model="useNumbers" @change="updatePassword">
        </div>
        <h2>Generated password :</h2>
        <div class="passg-result">
          <!-- Password will go here -->
          <p class="pwd">{{ password }}</p>
        </div>
        <button @click="copyPassword" class="button-event">Copy</button>
        <br>
        <span v-if="isCopied" class="copied">Copied!</span>
      </div>
    </div>
  </template>

<style scoped src="@/assets/main.css"></style>