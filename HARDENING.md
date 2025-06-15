# HARDENING 🛡️
# Cette section de la documentation récapitule tous les moyens mis en place pour hardené l'application 

### Firewall 👨‍🚒🔥

| Priorité | Mode  | Protocole | Adresse IP source | Port source | Port de destination | État TCP | Statut |
| -------- | ----- | --------- | ----------------- | ----------- | ------------------- | -------- | ------ |
| 1        | Allow | TCP       | **IP perso**  | *Any*       | 22                  | *Any*    | Enable | 
| 2        | Allow | TCP       | `all`             | *Any*       | 443                 | *Any*    | Enable |
| 3        | Deny  | TCP       | `all`             | *Any*       | 3306                | *Any*    | Enable |
| 4        | Deny  | Any       | `all`             | *Any*       | *Any*               | *Any*    | Enable |

*NOTE: la règle sur le ssh est retirer et rajouter à la main quand un accès en ssh au VPS est nécéssaire*

## Backend


