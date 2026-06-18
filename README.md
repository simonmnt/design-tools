# Annuaire d'inspiration

Un annuaire statique de sites d'inspiration, regroupés par catégorie.
Hébergé sur GitHub Pages. Aucune étape de build.

## Ajouter un lien

Éditer `links.json`. Dans la catégorie voulue, ajouter un objet au tableau `liens` :

```json
{ "nom": "Nom du site", "url": "https://exemple.com" }
```

## Ajouter une catégorie

Ajouter un objet au tableau racine de `links.json` :

```json
{
  "categorie": "Nouvelle catégorie",
  "liens": [
    { "nom": "Un site", "url": "https://exemple.com" }
  ]
}
```

L'ordre dans le fichier détermine l'ordre d'affichage.

## Tester en local

Le site fait un `fetch('links.json')` qui ne marche pas en ouvrant le fichier
directement (`file://`). Lancer un petit serveur :

```bash
python3 -m http.server 8000
```

Puis ouvrir http://localhost:8000

## Déployer sur GitHub Pages

1. Pousser le dépôt sur GitHub.
2. Settings → Pages → Source : la branche par défaut, dossier `/ (root)`.
3. Le site est publié à l'URL indiquée par GitHub.
