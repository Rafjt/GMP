# Documentation : Développement d'une Extension Chrome avec Vite & Vue.js

## Structure des Fichiers

```
chrome-extension/
│── public/
│   ├── manifest.json    # Fichier de configuration de l'extension
│   ├── icons/
│   │   ├── icon16.png
│   │   ├── icon48.png
│   │   ├── icon128.png
│── src/
│   ├── background/       # Scripts d'arrière-plan
│   │   ├── index.ts
│   ├── content/          # Scripts de contenu
│   │   ├── index.ts
│   ├── popup/            # Interface utilisateur popup
│   │   ├── App.vue
│   │   ├── main.ts
│   ├── options/          # Interface de configuration de l'extension
│   │   ├── App.vue
│   │   ├── main.ts
│   ├── assets/           # Styles et images
│   ├── utils/            # Fonctions utilitaires
│── dist/                 # Fichiers générés après build
│── vite.config.ts        # Configuration de Vite
│── tsconfig.json         # Configuration TypeScript
│── package.json          # Dépendances et scripts
│── .eslintrc.js          # Configuration ESLint
│── .gitignore            # Fichiers à ignorer
```

## Commandes Utiles

### Démarrer le développement
```sh
npm install  # Installer les dépendances
npm run dev  # Lancer Vite en mode développement
```

### Construire l'extension
```sh
npm run build  # Générer la version optimisée de l'extension
```

### Charger l'extension dans Chrome
1. Aller dans `chrome://extensions/`
2. Activer le mode développeur
3. Cliquer sur "Charger l'extension non empaquetée"
4. Sélectionner le dossier `dist/`

### Déployer l'extension sur le Chrome Web Store
1. Compresser le dossier `dist/` en `.zip`
2. Aller sur [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
3. Importer l'archive `.zip`
4. Suivre les étapes de publication

## Notes
- **HMR (Hot Module Replacement)** ne fonctionne pas pour les scripts de contenu, il faut recharger l'extension.
- Assurez-vous que le `manifest.json` contient les bonnes permissions selon les fonctionnalités de l'extension.
- Vous pouvez utiliser `web-ext` pour faciliter le déploiement et les tests.

## Liens Utiles
- [Documentation Vite](https://vitejs.dev/)
- [Documentation Vue.js](https://vuejs.org/)
- [Docs Chrome Extensions](https://developer.chrome.com/docs/extensions/)

