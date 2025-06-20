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

#### content_security_policy

A expliquer...

### Validation des données

Next move : valider les input utilisateurs et tout type d'attaque (checker les outils joi, dompurify, validator)

