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
        <button @click="copyPassword" class="copy">Copy</button>
        <br>
        <span v-if="isCopied" class="copied">Copied!</span>
      </div>
    </div>
  </template>

<style scoped>
h2{
    color: white;
}

.passg-container{
    background-color: #ffffff4b;
    margin-top: 10vh;
    padding: 5vh;
    border-radius: 1vh;
}

.copy {
  padding: 0.6rem;
  border: none;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s;
  margin-bottom: 2vh;
}

button:hover {
  background: rgba(255, 255, 255, 0.35);
}

.passg-options {
  display: flex;
  justify-content: space-between;
}

.passg-result {
    border: solid 1px rgba(255, 255, 255, 0.428);
    padding: 1vh;    /* or adjust as needed */
    margin-bottom: 1vh;
    height: auto;    /* ensures the div grows with content */
    word-break: break-all; /* optional, helps long passwords wrap */
}

.pwd{
    color: white;
}

.copied{
    background-color: #0000004f;
    padding: 1vh;
    border-radius: 10px;
}

</style>