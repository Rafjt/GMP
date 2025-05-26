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

## 🛡️ Pourquoi effectuer le chiffrement/déchiffrement dans background.js ? (Hyper important ⚠️)

Dans une **extension Chrome**, le script de fond (background.js) fonctionne dans un environnement isolé, séparé de l’interface utilisateur et des scripts de page. Pour des raisons de sécurité, il est fortement recommandé d’y effectuer toutes les opérations sensibles de chiffrement et déchiffrement. La clé cryptographique (CryptoKey) peut ainsi être conservée en mémoire dans le background, sans jamais être exportée ni exposée au frontend (popup, contenu Vue, etc.). Cela réduit fortement le risque qu’un attaquant puisse intercepter ou exfiltrer cette clé. Le frontend se contente d’envoyer les données à chiffrer ou à déchiffrer via chrome.runtime.sendMessage, et le background.js renvoie le résultat — jamais la clé elle-même. Ce modèle correspond aux meilleures pratiques de sécurité et imite le fonctionnement des gestionnaires de mots de passe professionnels. En résumé : ne jamais exposer la clé, ne jamais la stocker localement, et toujours effectuer les opérations critiques côté background.