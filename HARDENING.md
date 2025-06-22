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
