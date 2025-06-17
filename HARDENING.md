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
"Le package npm helmet sert à renforcer la sécurité des applications Node.js, en particulier celles construites avec Express, en configurant automatiquement divers en-têtes HTTP liés à la sécurité. En agissant comme un middleware, Helmet protège contre des vulnérabilités web courantes telles que les attaques de type Cross-Site Scripting (XSS), le clickjacking et d'autres menaces, en définissant des en-têtes comme Content-Security-Policy, Strict-Transport-Security, X-Frame-Options, et bien d'autres. Ces en-têtes limitent par exemple les sources de scripts autorisées, imposent l'utilisation du HTTPS, ou empêchent le chargement du site dans des iframes non autorisées. Helmet est donc un outil essentiel pour améliorer la sécurité de base d'une application web Node.js, sans nécessiter de configuration complexe"

### Fonctions verify token 🪙

Le middleware `verifyToken` assure la sécurité des routes privées de l’API en validant la présence et l’intégrité du token JWT transmis dans les cookies `(HttpOnly)`. Il vérifie que le token est bien signé avec la clé secrète du serveur, qu’il n’est pas expiré, et qu’il n’a pas été altéré. En cas d’échec, il bloque immédiatement l’accès à la route et renvoie une réponse d’erreur adaptée (`401` ou `500`). Lorsqu’un token est valide, les données qu’il contient (ex. : identifiant de l’utilisateur) sont automatiquement ajoutées à l’objet `req.user`, ce qui permet de sécuriser la logique applicative en aval. Ce middleware est une brique essentielle pour garantir que seuls les utilisateurs authentifiés peuvent interagir avec les routes sensibles de l’API.

### Cors policy strict ✅

Nos cors policy n'autorise que le stric minimum à savoir seulement les requêtes venant de notre extension et seulement les requêtes nécéssaire

### Rate Limiting 🚦

Nos fonction sont protégées par la fonction `Limiter` cette fonctions limite à `5` requêtes `par requête` et `par minute` chaque `IP` et donc `utilisateurs`.

### Hardening SQL

Next move : vérifier la solidité des appel à la bdd

## Frontend 

### Validation des données

Next move : valider les input utilisateurs et tout type d'attaque

