# Annuaire de sites d'inspiration — Design

**Date :** 2026-06-18
**Statut :** Validé pour planification

## Objectif

Un petit site personnel, hébergé sur GitHub Pages, qui affiche un annuaire de
sites d'inspiration regroupés par catégorie. Chaque entrée est un lien cliquable
accompagné de son favicon. Les données sont éditées à la main dans un fichier
JSON.

## Périmètre (et hors-périmètre)

**Inclus :**
- Affichage de catégories sous forme de sections qui se suivent.
- Pour chaque catégorie : une grille de cartes (favicon + nom), chaque carte
  ouvre le site dans un nouvel onglet.
- Menu d'ancres en haut pour sauter à une catégorie.
- Mode sombre par défaut.
- Données dans un fichier `links.json` édité manuellement.

**Exclu (YAGNI) :**
- Ajout de liens depuis le navigateur (pas de formulaire, pas de stockage).
- Recherche / filtres / tri.
- Notes, captures d'écran, tags.
- Bascule clair/sombre (sombre uniquement pour l'instant).
- Étape de build / générateur statique / dépendances.

## Approche technique

HTML + CSS + JavaScript vanilla, **sans aucune étape de build**. GitHub Pages
sert les fichiers statiques directement. Le JavaScript lit `links.json` au
chargement (`fetch`) et génère le DOM.

Séparation nette : `links.json` = les données, le reste = la présentation.

**Favicon :** récupéré à la volée via le service Google
`https://www.google.com/s2/favicons?domain=<domaine>&sz=64`. Aucun fichier image
à stocker. Si l'image échoue à charger, on affiche un repli (première lettre du
nom du site dans une pastille).

## Structure des fichiers

```
index.html      Structure minimale : barre de titre, conteneur vide, inclut style.css et app.js
style.css       Mise en forme, thème sombre, grille responsive
app.js          Charge links.json, génère le menu d'ancres et les sections/cartes
links.json      Données : catégories + liens
README.md       Comment ajouter un lien / une catégorie
```

## Format des données (`links.json`)

```json
[
  {
    "categorie": "Portfolios",
    "liens": [
      { "nom": "Awwwards", "url": "https://www.awwwards.com" },
      { "nom": "Behance",  "url": "https://www.behance.net" }
    ]
  },
  {
    "categorie": "Typographie",
    "liens": [
      { "nom": "Fonts In Use", "url": "https://fontsinuse.com" }
    ]
  }
]
```

- Ajouter un site = une ligne dans `liens`.
- Ajouter une catégorie = un nouvel objet dans le tableau.
- L'ordre du fichier = l'ordre d'affichage (menu et sections).

## Flux d'exécution (app.js)

1. `fetch('links.json')`.
2. Si l'appel échoue ou le JSON est invalide → afficher un message d'erreur
   lisible dans la page (pas de page blanche).
3. Si le tableau est vide → afficher un message « aucun lien pour l'instant ».
4. Sinon :
   a. Construire le menu d'ancres (un lien par catégorie).
   b. Pour chaque catégorie : un titre de section (avec `id` pour l'ancre) +
      une grille de cartes.
   c. Chaque carte : `<a>` vers `url`, `target="_blank"` +
      `rel="noopener noreferrer"`, contenant l'image favicon (avec repli lettre)
      et le nom.

## Mise en forme (style.css)

- **Thème sombre** par défaut : fond sombre, texte clair, cartes en surface
  légèrement plus claire avec coins arrondis et léger contour.
- **Grille responsive** :
  - Grand écran : 4 colonnes.
  - Écran moyen / tablette : 2-3 colonnes.
  - Mobile : 1 colonne.
  - Réalisée avec CSS Grid (`repeat(auto-fill, minmax(...))` ou media queries).
- **Carte** : favicon à gauche ou en haut + nom ; effet de survol discret
  (légère élévation / changement de surface).
- **Barre de titre** : titre de la page + menu d'ancres horizontal.

## Gestion des erreurs

| Situation                     | Comportement                                   |
|-------------------------------|------------------------------------------------|
| `links.json` introuvable      | Message d'erreur visible dans la page          |
| JSON mal formé                | Message d'erreur visible dans la page          |
| Tableau vide                  | Message « aucun lien »                          |
| Favicon ne charge pas         | Repli : pastille avec la première lettre du nom |

## Tests / vérification

Pas de framework de test pour un projet de cette taille. Vérification manuelle :
- La page se charge et affiche toutes les catégories de `links.json`.
- Les liens ouvrent le bon site dans un nouvel onglet.
- Le menu d'ancres saute à la bonne section.
- Le repli de favicon s'affiche pour une URL sans favicon.
- Les messages d'erreur s'affichent si `links.json` est cassé ou vide.
- Affichage correct en 4 / 2 / 1 colonnes selon la largeur.

## Déploiement

GitHub Pages depuis la branche par défaut (racine du dépôt). Aucune
configuration de build nécessaire.
