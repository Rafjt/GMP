# Documentation : Commandes de Base et Fonctionnement de Django

## Introduction à Django
Django est un framework web en Python permettant de développer des applications web de manière rapide et sécurisée. Il suit le modèle MVT (Model-View-Template), qui est une variante du MVC (Model-View-Controller).

## Installation de Django
Avant d'utiliser Django, il faut l'installer :
```bash
pip install django
```
Vérifiez l'installation avec :
```bash
django-admin --version
```

## Création d’un projet Django
Pour initialiser un nouveau projet Django, utilisez :
```bash
django-admin startproject nom_du_projet
```
Cela crée une arborescence avec :
- `manage.py` : outil de gestion du projet
- Un répertoire du nom du projet contenant les fichiers de configuration (`settings.py`, `urls.py`, etc.)

## Lancement du serveur de développement
```bash
python manage.py runserver
```
Par défaut, le serveur tourne sur `http://127.0.0.1:8000/`.

## Création d’une application
Une application est un module spécifique au sein d’un projet. Pour en créer une :
```bash
python manage.py startapp nom_de_l_app
```
Cette commande génère un répertoire avec :
- `models.py` : définition des modèles de base de données
- `views.py` : gestion des vues
- `urls.py` : gestion des routes (à créer manuellement)
- `admin.py` : configuration de l’interface d’administration

## Modèles et Base de Données
### Définition d’un modèle
Dans `models.py` :
```python
from django.db import models

class Article(models.Model):
    titre = models.CharField(max_length=200)
    contenu = models.TextField()
    date_publication = models.DateTimeField(auto_now_add=True)
```
### Application des migrations
Une fois le modèle défini, appliquez les migrations :
```bash
python manage.py makemigrations
python manage.py migrate
```
### Création d’un superutilisateur
```bash
python manage.py createsuperuser
```
Cela permet d’accéder à l’interface d’administration via `http://127.0.0.1:8000/admin/`.

## Les Vues et les Templates
### Création d’une vue simple
Dans `views.py` :
```python
from django.http import HttpResponse

def accueil(request):
    return HttpResponse("Bienvenue sur mon site Django !")
```
### Déclaration de la route
Dans `urls.py` de l’application :
```python
from django.urls import path
from .views import accueil

urlpatterns = [
    path('', accueil, name='accueil'),
]
```
### Utilisation des Templates
Django utilise un moteur de templates pour afficher des pages HTML dynamiques. Exemple de template (`templates/index.html`) :
```html
<!DOCTYPE html>
<html>
<head>
    <title>Accueil</title>
</head>
<body>
    <h1>Bienvenue sur mon site Django !</h1>
</body>
</html>
```
Ajoutez l’affichage du template dans `views.py` :
```python
from django.shortcuts import render

def accueil(request):
    return render(request, 'index.html')
```

## Administration et Interface d’Admin
Django propose une interface d’administration puissante :
### Ajout d’un modèle à l’admin
Dans `admin.py` :
```python
from django.contrib import admin
from .models import Article

admin.site.register(Article)
```
Cela permet de gérer les articles via `http://127.0.0.1:8000/admin/`.

## Conclusion
Django est un framework puissant qui facilite la création d’applications web. Cette documentation couvre les bases, mais il existe de nombreuses fonctionnalités avancées comme les API REST (Django REST Framework), les signaux et la gestion avancée des utilisateurs.

Pour plus d’informations, consultez la documentation officielle : [https://docs.djangoproject.com/fr/](https://docs.djangoproject.com/fr/)