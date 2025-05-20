# Frontend TIPS


## 🚀 About this page
This page purpose is to store valuable data and tips about the frontend codebase. 


### ref

to import 
````
import { ref } from 'vue'
````
it can be used to watch on a property and update it dynamically like in the `PasswordView.vue` file

````
onMounted(async () => {
  const data = await pullPassword();
  passwords.value = data; <-- here we indicate that the result of pullPassword will fed passswords.value
});

const passwords = ref([]); <-- this line defines the empty passwords list that waiting to be fed

````
