# HARDENING 🛡️
# Cette section de la documentation récapitule tous les moyens mis en place pour hardené l'application

### HTTPS obligatoire 🔒
Toutes les requêtes doivent passer par HTTPS uniquement.

Aucun accès direct en HTTP n'est permis en production, puisque l'on force le HTTPS côté reverse proxy (Nginx) avec un `redirect 301`.

### Firewall 👨‍🚒🔥

| Priorité | Mode  | Protocole | Adresse IP source | Port source | Port de destination | État TCP | Statut |
| -------- | ----- | --------- | ----------------- | ----------- | ------------------- | -------- | ------ |
| 1        | Allow | TCP       | **IP perso**  | *Any*       | 22                  | *Any*    | Enable | 
| 2        | Allow | TCP       | `all`             | *Any*       | 443                 | *Any*    | Enable |
| 3        | Deny  | TCP       | `all`             | *Any*       | 3306                | *Any*    | Enable |
| 4        | Deny  | Any       | `all`             | *Any*       | *Any*               | *Any*    | Enable |

*NOTE: la règle sur le ssh est retirer et rajouter à la main quand un accès en ssh au VPS est nécéssaire*

## Backend

### Helmet 🪖
Le package npm `helmet` sert à renforcer la sécurité des applications Node.js, en particulier celles construites avec Express, en configurant automatiquement divers en-têtes HTTP liés à la sécurité.
Helmet protège contre des vulnérabilités web courantes telles que :

* les attaques XSS (Cross-Site Scripting),
* le clickjacking,
* les injections de contenu via les iframes,
* ou encore les attaques basées sur les types MIME.

Les principaux headers configurés incluent `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, etc.
Helmet est un outil fondamental pour durcir la surface d'attaque d’une API REST.

### verifyToken 🪙 – Middleware JWT

Le middleware `verifyToken` protège les routes sensibles de l'API en validant les jetons JWT transmis dans les cookies **`HttpOnly`**.

Fonctionnement :

* Vérifie la présence du cookie `token`
* Décode le token avec la clé secrète
* S’assure qu’il n’est **pas expiré** ou altéré
* Injecte automatiquement les infos (`id`, `login`, etc.) dans `req.user`
* En cas d’échec, la requête est bloquée avec un code **`401 Unauthorized`**

C’est une mesure essentielle pour garantir que seuls les utilisateurs authentifiés peuvent accéder à certaines routes (accès aux mots de passe chiffrés, modification, suppression, etc.).

---

### Cors policy strict ✅

Nous avons appliqué une **politique CORS minimale** :

* Seules les requêtes issues de **l'extension Chrome** (frontend) sont autorisées.
* Les méthodes permises sont uniquement celles utilisées dans l’application (`GET`, `POST`, `PUT`, `DELETE`).
* Les headers autorisés sont strictement contrôlés.
* Les credentials (`cookies`) sont autorisés pour permettre le transport du token JWT sécurisé.

Cela permet de **bloquer toutes les requêtes provenant d'autres domaines** (API publiques, scripts malveillants, etc.).

---

### Limiter 🧱 – Middleware anti-bruteforce

Un middleware de type **rate limiter** est utilisé sur **toutes les routes critiques** comme :

* `POST /login`
* `POST /register`
* `GET /verify-email`

Cela permet :

* de **limiter les tentatives par IP** (ex: 5 tentatives/minute),
* d'éviter les attaques par force brute,
* de prévenir le spam ou l’exploitation des endpoints publics.

### Sécurité des routes API 🔐

Chaque route sensible respecte une politique stricte :

#### ✅ Vérification de propriété utilisateur :

Avant toute suppression/modification de mot de passe chiffré :

* une requête SQL vérifie que la ressource (mot de passe) appartient bien à l’utilisateur (`user_id = req.user.id`),
* sinon, la requête est rejetée avec une **404** ou **403**.

#### ✅ Gestion d’erreurs personnalisée :

Les messages d'erreur sont **neutres** pour ne pas divulguer d'informations :

* "Invalid credentials" pour éviter de savoir si l’email est correct.
* "Account not verified" en cas de login avant validation.

---

### Authentification sécurisée 🔑

#### Login

* Comparaison du mot de passe haché avec **bcrypt**
* Renvoi d’un token JWT signé (durée : 1h)
* Stockage dans un cookie **HttpOnly**, **secure**, **sameSite: 'Strict'** (prod)

#### Register

* Création d’un utilisateur en base avec :

  * champ `is_verified = false`
  * token de vérification aléatoire (hex)
* Envoi d’un mail avec un lien de vérification

#### Email Verification

* Vérifie que le token correspond à un utilisateur existant
* Ignore les vérifications multiples
* Marque l’email comme vérifié et génère un `salt` unique (base64)

---

## Frontend

### Manifest.json

#### `content_security_policy`

```json
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'none'; base-uri 'none'; connect-src 'self' https://rrpm.site/*"
}
````

#### 🔒 Mesures de sécurité appliquées

| Directive                                | Rôle                                                                 | Sécurité apportée                                               |
| ---------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------- |
| `script-src 'self'`                      | N'autorise que les scripts internes à l’extension.                   | Protège contre les attaques XSS (Cross-Site Scripting).         |
| `object-src 'none'`                      | Interdit le chargement de balises `<object>`, `<embed>`, `<applet>`. | Supprime les vecteurs d'attaque via anciens formats ou plugins. |
| `base-uri 'none'`                        | Interdit la balise `<base>` qui altère la résolution des URL.        | Empêche la réécriture malveillante des chemins relatifs.        |
| `connect-src 'self' https://rrpm.site/*` | N'autorise les requêtes réseau qu’à l’API du serveur.                | Empêche les fuites de données vers des hôtes non autorisés.     |

#### ✅ Objectifs de cette configuration

* 🔐 **Réduction de la surface d’attaque** en bloquant tous les scripts et connexions non explicitement autorisés.
* 🚫 **Prévention du code dynamique ou injecté**, limitant drastiquement les risques de compromission.
* 🧱 **Verrouillage strict des origines de communication** avec le backend de l’application (`https://rrpm.site` uniquement).


---
### Register/login

| **Type de Risque**                | **Mitigation Appliquée**                                                     | **Description**                                                                                    |
| --------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **XSS (Cross-Site Scripting)**    | Utilisation de `DOMPurify` pour afficher les messages d'erreur               | Assainit les messages d'erreur pour éviter l'injection de code HTML ou JavaScript                  |
| **Brute force**                   | Aucun accès explicite dans le code, mais pourrait être atténué côté serveur  | Attente progressive ou limitation serveur recommandée (non visible dans le code frontend)          |
| **Injection de code malveillant** | `DOMPurify` + absence de rendu direct de champs sensibles                    | Empêche tout rendu d’entrée utilisateur sans nettoyage                                             |
| **Session / JWT compromise**      | Clé de chiffrement requise (implicite dans `decrypt()` après login)          | Le frontend attend une clé valide (probablement stockée temporairement en mémoire/session)         |
| **Redirection forcée**            | Redirection sécurisée manuelle via `router.push('/home')` après login réussi | Empêche les redirections non contrôlées post-authentication                                        |
| **Feedback utilisateur**          | Messages de retour explicites mais assainis                                  | Empêche de donner des indices sur la validité d'un identifiant spécifique (ex. email non existant) |

---
### Password View 👁️

| **Type de Risque**                        | **Mitigation Appliquée**                                               | **Description**                                                                        |
| ----------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **XSS (Cross-Site Scripting)**            | `DOMPurify` pour les messages d'erreur utilisateur                     | Empêche l'injection de scripts via les messages affichés à l'écran                     |
| **Vol visuel de mot de passe**            | Masquage par défaut + Affichage limité dans le temps (10s)             | Empêche un mot de passe d’être visible indéfiniment dans l’interface                   |
| **Persistance en mémoire**                | Suppression du mot de passe après copie                                | Évite que le mot de passe reste accessible dans le DOM ou en mémoire inutilement       |
| **Social engineering / shoulder surfing** | Affichage partiel avec bullet points `•••` + bouton `Show`             | Réduction du risque d'exposition visuelle accidentelle ou involontaire                 |
| **Clipboard hijacking**                   | Timeout visuel `✅ Copied!` + pas de retour du mot de passe après copie | L’utilisateur n’est pas incité à coller dans des zones à risque (ex : forums, emails…) |
| **Clickjacking / sélection involontaire** | `user-select: none` sur les valeurs de mot de passe                    | Empêche la sélection et copie involontaire (hors clic explicite)                       |
| **Accès non autorisé (clé manquante)**    | Déconnexion + redirection automatique en cas d’échec de déchiffrement  | Prévention d’un état incohérent ou d’une session invalide dans le navigateur           |
| **Injection dans la recherche**           | Recherche en `toLowerCase()` avec `includes()`                         | Empêche les injections HTML/JS, même si champ de recherche maltraité                   |

---
### Password Manage View 🔧

| **Type de Risque**                     | **Mitigation Appliquée**                                                    | **Description**                                                          |
| -------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **XSS (Cross-Site Scripting)**         | `DOMPurify` utilisé pour tous les messages d'erreur                         | Empêche les entrées malicieuses de s’exécuter dans l’UI                  |
| **Faille de type DOM-based XSS**       | Aucun rendu direct de données utilisateurs dans le DOM sans contrôle        | Pas d’`innerHTML`, aucun contenu injecté dynamiquement en HTML pur       |
| **Fuite de mot de passe**              | Données encryptées avant stockage (présumé via `encrypt()` non montré ici)  | Le mot de passe est chiffré côté client avant tout envoi serveur         |
| **Injection HTML dans les champs**     | Les valeurs affichées sont statiques, non rendues comme HTML                | Même si un champ contenait `<script>`, il ne serait pas interprété       |
| **Altération d’un mot de passe tiers** | Mode `edit` strictement conditionné à un `id` fourni                        | Prévient les modifications arbitraires si aucun identifiant n’est fourni |
| **Manque de feedback utilisateur**     | Messages d’erreurs clairs et visuellement encadrés                          | L’utilisateur est bien informé des erreurs, sans fuite technique         |
| **Redirection forcée sans contrôle**   | `router.push('/home')` ou `/login` déclenchés manuellement et explicitement | Empêche une redirection injectée par URL ou manipulation externe         |

### Service worker 🥷👷‍♂️

| Type de mitigation              | Détail                                                                 |
| ------------------------------- | ---------------------------------------------------------------------- |
| **Filtrage du sender**          | `sender.id === chrome.runtime.id`                                      |
| **Validation du message**       | Types de message whitelistés                                           |
| **Fonctions isolées**           | Une par type de message                                                |
| **Journalisation contrôlée**    | `console.warn` pour anomalies, pas d’exfiltration de données sensibles |
| **Centralisation des réponses** | Via `respond()`                                                        |
| **Cache contrôlé**              | La clé est stockée uniquement en mémoire, jamais en `storage`          |


___

## Major encryption system vulnerability


---

### 🔐 AES-GCM avec IV déterministe

### 📌 Problème

AES-GCM **exige un IV unique** pour chaque chiffrement avec une même clé.
Utiliser un IV **aléatoire** ne garantit pas l’unicité → **risque de faille de sécurité** (ex. : perte de confidentialité, contournement de l’intégrité).

### Le nombre de tour de AES-GCM lors de la dérivation de la clé à été augmenter à 600 000 tours suite à la lecture du texte ci-dessous:

'By default, Bitwarden is set to iterate 600,000 times, as recommended by OWASP for HMAC-SHA-256 implementations. So long as the user does not set this value lower, the implementation is FIPS-140 compliant, but here are some tips should you choose to change your settings.'

---

### ✅ Solution

Utilisation d’un **IV déterministe basé sur un compteur local** :

* Le compteur est stocké dans `localStorage`.
* À chaque chiffrement :

  * Le compteur est lu et transformé en IV de 12 octets.
  * Il est ensuite incrémenté.
  * L’IV est préfixé au message chiffré pour pouvoir le réutiliser au déchiffrement.

---

### 🧠 Avantages

* IV **garanti unique** (jusqu’à 2³² messages).
* Compatible navigateur.
* Aucune dépendance externe ou serveur.

---

### 📂 Exemple

```js
function getNonceCounter() {
  const key = 'aes-gcm-nonce-counter';
  let val = parseInt(localStorage.getItem(key)) || 0;
  localStorage.setItem(key, val + 1);
  return val;
}

function generateDeterministicIV(counter) {
  const iv = new Uint8Array(12);
  new DataView(iv.buffer).setUint32(8, counter);
  return iv;
}
```

---

# 📄 Authentification Login + 2FA + JWT (Documentation Technique)

## 📝 Objectif

Mettre en place une authentification sécurisée avec :

* Login classique (email + mot de passe)
* Authentification à deux facteurs (2FA) optionnelle
* Gestion sécurisée du token JWT selon le contexte (avec/sans 2FA)

---

## 🔄 Flux global

1. L'utilisateur tente de se connecter avec son email et son mot de passe.
2. Si l'utilisateur n'a **pas activé le 2FA** :

   * Le backend valide les identifiants.
   * Génère immédiatement un **JWT** (valable 1h).
   * Le JWT est envoyé dans un **cookie sécurisé** (`httpOnly` + `secure`).
   * L'utilisateur est connecté.
3. Si l'utilisateur a activé le 2FA :

   * Le backend valide les identifiants.
   * Répond en demandant le code 2FA :

     ```json
     { "twoFactorRequired": true, "userId": ID }
     ```
   * L'utilisateur entre son code 2FA.
   * Si le code est correct :

     * Le backend génère et renvoie le **JWT** dans le cookie sécurisé.
     * L'utilisateur est connecté.

---

## 🗂️ Résumé par endpoint

### POST `/login`

* Vérifie l'email et le mot de passe.
* Si 2FA désactivé → envoie immédiatement le JWT dans un cookie.
* Si 2FA activé → ne génère pas de JWT, mais demande le code 2FA.

**Réponses possibles :**

```json
// Sans 2FA (login OK) :
{ "message": "Login successful", "token": "..." }

// Avec 2FA requis :
{ "message": "2FA required", "twoFactorRequired": true, "userId": 123 }
```

---

### POST `/verify-2fa`

* Vérifie le code 2FA pour l’utilisateur.
* Si OK → génère le JWT dans un cookie sécurisé.

**Réponse :**

```json
{ "success": true, "message": "2FA validated, login successful" }
```

---

## 🔑 Gestion du JWT

| Cas                          | JWT Généré Dans |
| ---------------------------- | --------------- |
| Sans 2FA                     | `/login`        |
| Avec 2FA (après succès code) | `/verify-2fa`   |

---

## 🔒 Sécurité du JWT

* Stocké dans un **cookie HTTP-only** :

```js
res.cookie("token", token, {
  httpOnly: true,
  secure: true,
  sameSite: "None",
  maxAge: 3600000, // 1h
});
```

---

## 💻 Workflow Frontend (Vue 3)

### Étapes :

1. L’utilisateur soumet le formulaire de login.
2. Si réponse `"twoFactorRequired"`, on demande le code 2FA.
3. Sinon → login direct.
4. Après succès 2FA → login final + déblocage du coffre.

### Code principal (Vue) :

```js
if (loginResponse.twoFactorRequired) {
  is2FARequired.value = true;
  pendingUserId.value = loginResponse.userId;
} else {
  await unlockVault();
}
```

---

## 📦 Résumé des avantages

* 🔐 **Sécurisé** : JWT attribué uniquement si l'utilisateur est bien authentifié (mot de passe + 2FA si activé).
* 🎯 **Flexible** : S’adapte à chaque utilisateur selon son statut 2FA.
* 📄 **Standard** : Fonctionnement conforme aux pratiques modernes (JWT + cookie HTTP-only + 2FA).

---

## ✅ Conseils

* Toujours bien configurer `secure: true` (requiert HTTPS).
* Nettoyer correctement les messages d'erreur (prévention XSS).
* Bien logguer les tentatives d'échec côté serveur.

---

Voici la documentation complète en **Markdown** du workflow de gestion du TOTP (2FA) que tu viens de partager, structurée clairement :

---

# 📄 Documentation Technique — Gestion du TOTP (2FA) avec Node.js / Express / Speakeasy

## 🎯 Objectif

Mettre en place la gestion complète de l’authentification à deux facteurs (2FA) basée sur le protocole TOTP :

* Activation / Désactivation du 2FA
* Chiffrement sécurisé de la clé secrète TOTP (AES-256-GCM)
* Vérification du code TOTP
* JWT généré uniquement après la validation 2FA

---

## 🔒 Fonctionnement Global

### 1. Génération et chiffrement du secret TOTP :

* Le secret TOTP est généré via **Speakeasy**.
* Ce secret est ensuite chiffré avec une clé maîtresse (`TOTP_MASTER_KEY`) via **AES-256-GCM**.
* Le secret chiffré est stocké en base dans la table `user_2fa`.

### 2. Vérification de la connexion TOTP :

* Lors de la vérification, le secret TOTP est **déchiffré**.
* Le code TOTP entré par l’utilisateur est vérifié via **Speakeasy**.
* Si le code est valide → un JWT est généré et renvoyé dans un cookie sécurisé.

---

## 📦 Détail des Fonctions Importantes

### 🔐 Chiffrement / Déchiffrement AES-256-GCM

**Clé :** `TOTP_MASTER_KEY` (doit être une clé hexadécimale de 32 bytes, soit 64 caractères hex).

#### 🔒 Fonction de chiffrement :

```js
encrypt(text, key);
```

#### 🔓 Fonction de déchiffrement :

```js
decrypt(encryptedData, key);
```

---

## 🔄 Flux Backend des Routes 2FA

| Route              | Description                                     | Authentification             |
| ------------------ | ----------------------------------------------- | ---------------------------- |
| `GET /isEnabled`   | Vérifie si le 2FA est activé pour l'utilisateur | ✅ JWT requis                 |
| `POST /enable`     | Active le 2FA et génère un QR Code              | ✅ JWT requis                 |
| `POST /disable`    | Désactive le 2FA                                | ✅ JWT requis                 |
| `POST /verify-2fa` | Vérifie le code TOTP et génère un JWT           | 🚫 Pas de JWT requis (login) |

---

### ✅ Exemple de Réponse `/enable`

```json
{
  "success": true,
  "message": "2FA activé. Scanne le QR Code.",
  "otpauth_url": "otpauth://totp/Rrpm%20(user)?secret=XXXX..."
}
```

---

## 🔑 JWT dans ce Flux

| Étape             | JWT émis ? | Où ?                 |
| ----------------- | ---------- | -------------------- |
| Activation 2FA    | Non        |                      |
| Vérification 2FA  | Oui        | Après succès du TOTP |
| Désactivation 2FA | Non        |                      |

---

## 🔄 Workflow Complet du 2FA (TOTP)

1. **L'utilisateur s'authentifie** (email/mot de passe).
2. Si 2FA activé → code TOTP requis.
3. L'utilisateur scanne le QR Code dans son appli 2FA.
4. Le serveur stocke la clé secrète **chiffrée**.
5. L'utilisateur entre le code TOTP pour se connecter.
6. Le serveur déchiffre le secret et vérifie le code.
7. Si correct → JWT généré + connexion validée.

---

## 🔐 Sécurité :

* **Chiffrement Fort :** AES-256-GCM + clé maître externe.
* **Cookie JWT sécurisé :**

  * `httpOnly`
  * `secure` (HTTPS requis)
  * `sameSite: 'None'` (si nécessaire pour cross-origin)
* Protection contre brute-force via middleware `Limiter` (anti-spam).

---

## 📋 Résumé

| Composant          | Utilisation                                 |
| ------------------ | ------------------------------------------- |
| `speakeasy`        | Génération + vérification TOTP              |
| `crypto` (AES-GCM) | Chiffrement/déchiffrement clé TOTP          |
| `jsonwebtoken`     | Gestion des JWT (connexion)                 |
| `sequelize`        | Requêtes SQL sécurisées                     |
| `Limiter`          | Limitation de requêtes pour éviter les abus |

---

## 📝 Notes Importantes

* La **clé maître** doit être protégée (ex. : `.env`).
* Ne jamais exposer le secret TOTP en clair.
* Toujours vérifier l’ID utilisateur via JWT avant d'activer/désactiver 2FA.
* Bien gérer les erreurs pour éviter toute fuite d'information.

---

## 🎯 Points clés :

* 🔐 2FA robuste avec stockage sécurisé
* 📡 JWT délivré uniquement après authentification complète
* 💾 Données stockées en base sous forme chiffrée
* 🕵️‍♂️ Résistant aux attaques même en cas de compromission partielle

---

## ✅ Conclusion :

Ce workflow est **sécurisé et conforme** aux bonnes pratiques modernes :

* TOTP (RFC 6238)
* JWT sécurisé
* Chiffrement des secrets
