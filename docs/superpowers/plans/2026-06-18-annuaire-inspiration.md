# Annuaire de sites d'inspiration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construire un annuaire statique de sites d'inspiration, regroupés par catégorie, hébergeable sur GitHub Pages, dont les données sont éditées à la main dans `links.json`.

**Architecture:** Site statique sans build. `index.html` charge `style.css` et `app.js`. Au chargement, `app.js` fait un `fetch('links.json')`, gère les erreurs, puis génère un menu d'ancres et une section par catégorie (chaque section contenant une grille de cartes favicon + nom). Thème sombre, grille responsive en CSS.

**Tech Stack:** HTML5, CSS3 (CSS Grid), JavaScript vanilla (ES modules non nécessaires), service favicon Google. Aucun gestionnaire de paquets, aucune dépendance, aucune étape de build.

## Global Constraints

- Aucune étape de build, aucune dépendance npm, aucun framework (HTML/CSS/JS vanilla uniquement).
- Tous les fichiers servables à la racine du dépôt (compatibilité GitHub Pages).
- Thème **sombre par défaut** uniquement (pas de bascule clair/sombre).
- Grille responsive : 4 colonnes (grand écran) → 2-3 (tablette) → 1 (mobile).
- Favicon via `https://www.google.com/s2/favicons?domain=<domaine>&sz=64`, avec repli pastille (première lettre du nom) si l'image échoue.
- Liens : `target="_blank"` + `rel="noopener noreferrer"`.
- Données dans `links.json` : tableau d'objets `{ "categorie": string, "liens": [{ "nom": string, "url": string }] }`. L'ordre du fichier = l'ordre d'affichage.
- Pas de framework de test : vérification **manuelle dans le navigateur** via un serveur local (`python3 -m http.server`), car `fetch` d'un fichier local échoue en `file://`.

---

## File Structure

```
index.html      Structure : <header> (titre + nav d'ancres vide), <main> conteneur vide, inclut style.css et app.js
style.css       Thème sombre, header/nav, grille responsive, carte, états (erreur/vide), pastille de repli
app.js          fetch + parse + validation, construction du menu d'ancres et des sections/cartes, repli favicon
links.json      Données initiales (quelques catégories d'exemple)
README.md       Comment ajouter un lien / une catégorie, comment lancer en local, comment déployer
```

Une responsabilité par fichier. `app.js` reste le seul à manipuler le DOM ; `links.json` ne contient que des données ; `style.css` ne contient que de la présentation.

---

### Task 1: Squelette HTML + données initiales + lancement local

**Files:**
- Create: `index.html`
- Create: `links.json`
- Test: vérification manuelle navigateur

**Interfaces:**
- Consumes: rien.
- Produces:
  - `index.html` contenant exactement ces hooks pour `app.js` :
    - `<nav id="categories-menu">` (menu d'ancres, rempli par JS)
    - `<main id="app">` (conteneur des sections, rempli par JS)
  - `links.json` : tableau racine `[{ "categorie": string, "liens": [{ "nom": string, "url": string }] }]`.

- [ ] **Step 1: Créer `index.html`**

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Annuaire d'inspiration</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header class="site-header">
    <h1 class="site-title">Annuaire d'inspiration</h1>
    <nav id="categories-menu" class="categories-menu" aria-label="Catégories"></nav>
  </header>
  <main id="app" class="app"></main>
  <script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Créer `links.json` avec des données d'exemple**

```json
[
  {
    "categorie": "Portfolios",
    "liens": [
      { "nom": "Awwwards", "url": "https://www.awwwards.com" },
      { "nom": "Behance", "url": "https://www.behance.net" },
      { "nom": "Dribbble", "url": "https://dribbble.com" }
    ]
  },
  {
    "categorie": "Typographie",
    "liens": [
      { "nom": "Fonts In Use", "url": "https://fontsinuse.com" },
      { "nom": "Google Fonts", "url": "https://fonts.google.com" }
    ]
  }
]
```

- [ ] **Step 3: Lancer un serveur local et ouvrir la page**

Run :
```bash
cd /Users/simon/Documents/LAB_TEST/design-tools && python3 -m http.server 8000
```
Ouvrir `http://localhost:8000` dans le navigateur.
Expected : la page affiche le titre « Annuaire d'inspiration ». Le corps est vide pour l'instant (pas encore de JS). Aucune erreur de chargement de `style.css` introuvable n'est bloquante à ce stade (le fichier sera créé en Task 3) ; ignorer le 404 sur `style.css`.

- [ ] **Step 4: Commit**

```bash
git add index.html links.json
git commit -m "feat: squelette HTML et donnees initiales"
```

---

### Task 2: app.js — chargement, validation et gestion d'erreurs

**Files:**
- Create: `app.js`
- Test: vérification manuelle navigateur (console + affichage)

**Interfaces:**
- Consumes: `#categories-menu`, `#app` depuis `index.html` ; `links.json`.
- Produces (fonctions internes à `app.js`, réutilisées en Task 4) :
  - `loadData()` → `Promise<Array>` : fait `fetch('links.json')`, parse, et **valide** que la racine est un tableau ; lève une erreur sinon.
  - `showMessage(text)` : vide `#app` et y insère `<p class="message">text</p>`.
  - `render(data)` : point d'entrée d'affichage (en Task 2, implémentation minimale : voir Step 3 ; complétée en Task 4).

- [ ] **Step 1: Écrire `app.js` avec chargement + erreurs + cas vide**

```js
(function () {
  "use strict";

  const appEl = document.getElementById("app");
  const menuEl = document.getElementById("categories-menu");

  function showMessage(text) {
    menuEl.innerHTML = "";
    appEl.innerHTML = "";
    const p = document.createElement("p");
    p.className = "message";
    p.textContent = text;
    appEl.appendChild(p);
  }

  async function loadData() {
    const response = await fetch("links.json");
    if (!response.ok) {
      throw new Error("Fichier links.json introuvable (HTTP " + response.status + ")");
    }
    const data = await response.json(); // lève une erreur si JSON invalide
    if (!Array.isArray(data)) {
      throw new Error("links.json doit contenir un tableau");
    }
    return data;
  }

  function render(data) {
    if (data.length === 0) {
      showMessage("Aucun lien pour l'instant.");
      return;
    }
    // Affichage complet implémenté en Task 4.
    showMessage("Données chargées : " + data.length + " catégorie(s).");
  }

  loadData()
    .then(render)
    .catch(function (err) {
      showMessage("Erreur de chargement : " + err.message);
    });
})();
```

- [ ] **Step 2: Vérifier le cas nominal**

Avec le serveur local lancé, recharger `http://localhost:8000`.
Expected : le message « Données chargées : 2 catégorie(s). » s'affiche. Aucune erreur rouge dans la console.

- [ ] **Step 3: Vérifier le cas JSON cassé**

Introduire temporairement une erreur de syntaxe dans `links.json` (par ex. retirer une virgule), recharger la page.
Expected : un message « Erreur de chargement : … » s'affiche dans la page (pas de page blanche). **Rétablir ensuite `links.json` à l'état valide.**

- [ ] **Step 4: Vérifier le cas tableau vide**

Remplacer temporairement le contenu de `links.json` par `[]`, recharger.
Expected : message « Aucun lien pour l'instant. ». **Rétablir ensuite les données d'exemple.**

- [ ] **Step 5: Commit**

```bash
git add app.js
git commit -m "feat: chargement de links.json avec validation et gestion d'erreurs"
```

---

### Task 3: style.css — thème sombre, layout et grille responsive

**Files:**
- Create: `style.css`
- Test: vérification manuelle navigateur (redimensionnement)

**Interfaces:**
- Consumes: les classes/ids posés par `index.html` (`.site-header`, `.site-title`, `#categories-menu`, `#app`, `.message`) et ceux qui seront produits par Task 4 (`.category`, `.category-title`, `.cards`, `.card`, `.card-favicon`, `.card-fallback`, `.card-name`). Cette task style **tous** ces sélecteurs dès maintenant pour éviter un aller-retour.
- Produces: feuille de style complète ; aucune interface JS.

- [ ] **Step 1: Écrire `style.css`**

```css
:root {
  --bg: #121316;
  --surface: #1c1e22;
  --surface-hover: #24272c;
  --border: #2e3238;
  --text: #e7e9ec;
  --text-dim: #9aa0a8;
  --accent: #6ea8fe;
  --radius: 12px;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  line-height: 1.4;
}

.site-header {
  padding: 24px 20px 12px;
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  background: var(--bg);
  z-index: 10;
}

.site-title {
  margin: 0 0 12px;
  font-size: 1.5rem;
}

.categories-menu {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
}

.categories-menu a {
  color: var(--text-dim);
  text-decoration: none;
  font-size: 0.9rem;
}

.categories-menu a:hover { color: var(--accent); }

.app { padding: 24px 20px 64px; max-width: 1200px; margin: 0 auto; }

.message { color: var(--text-dim); }

.category { margin-bottom: 40px; scroll-margin-top: 110px; }

.category-title {
  margin: 0 0 16px;
  font-size: 1.15rem;
  border-bottom: 1px solid var(--border);
  padding-bottom: 8px;
}

.cards {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(4, 1fr);
}

@media (max-width: 900px) {
  .cards { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 640px) {
  .cards { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 420px) {
  .cards { grid-template-columns: 1fr; }
}

.card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  text-decoration: none;
  color: var(--text);
  transition: background 0.15s ease, transform 0.15s ease;
}

.card:hover {
  background: var(--surface-hover);
  transform: translateY(-2px);
}

.card-favicon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  flex-shrink: 0;
  background: var(--bg);
}

.card-fallback {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  background: var(--accent);
  color: #0b1220;
  text-transform: uppercase;
}

.card-name {
  font-size: 0.95rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

- [ ] **Step 2: Vérifier le thème**

Recharger `http://localhost:8000`.
Expected : fond sombre, texte clair, titre et menu lisibles. (Le corps montre encore le message de Task 2 — normal.)

- [ ] **Step 3: Commit**

```bash
git add style.css
git commit -m "feat: theme sombre et grille responsive"
```

---

### Task 4: app.js — rendu des sections, cartes et favicons

**Files:**
- Modify: `app.js` (remplacer la fonction `render` + ajouter les fonctions de construction)
- Test: vérification manuelle navigateur

**Interfaces:**
- Consumes: `loadData()`, `showMessage()` de Task 2 ; classes CSS de Task 3.
- Produces: `render(data)` complet qui génère le menu d'ancres et les sections.

- [ ] **Step 1: Remplacer la fonction `render` minimale de Task 2**

Remplacer **uniquement** le corps de la fonction `render` (celui qui contient `showMessage("Données chargées …")`) par la version ci-dessous, et ajouter les fonctions helper `slugify`, `buildMenu`, `buildCategory`, `buildCard` juste au-dessus de `render` :

```js
  function slugify(text) {
    return text
      .toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function buildCard(lien) {
    const card = document.createElement("a");
    card.className = "card";
    card.href = lien.url;
    card.target = "_blank";
    card.rel = "noopener noreferrer";

    let domain = "";
    try { domain = new URL(lien.url).hostname; } catch (e) { domain = ""; }

    const img = document.createElement("img");
    img.className = "card-favicon";
    img.alt = "";
    img.loading = "lazy";
    img.src = "https://www.google.com/s2/favicons?domain=" + encodeURIComponent(domain) + "&sz=64";
    img.addEventListener("error", function () {
      const fallback = document.createElement("span");
      fallback.className = "card-fallback";
      fallback.textContent = (lien.nom || "?").charAt(0);
      img.replaceWith(fallback);
    });

    const name = document.createElement("span");
    name.className = "card-name";
    name.textContent = lien.nom;

    card.appendChild(img);
    card.appendChild(name);
    return card;
  }

  function buildCategory(cat) {
    const section = document.createElement("section");
    section.className = "category";
    section.id = slugify(cat.categorie);

    const title = document.createElement("h2");
    title.className = "category-title";
    title.textContent = cat.categorie;
    section.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "cards";
    (cat.liens || []).forEach(function (lien) {
      grid.appendChild(buildCard(lien));
    });
    section.appendChild(grid);
    return section;
  }

  function buildMenu(data) {
    menuEl.innerHTML = "";
    data.forEach(function (cat) {
      const a = document.createElement("a");
      a.href = "#" + slugify(cat.categorie);
      a.textContent = cat.categorie;
      menuEl.appendChild(a);
    });
  }

  function render(data) {
    if (data.length === 0) {
      showMessage("Aucun lien pour l'instant.");
      return;
    }
    appEl.innerHTML = "";
    buildMenu(data);
    data.forEach(function (cat) {
      appEl.appendChild(buildCategory(cat));
    });
  }
```

- [ ] **Step 2: Vérifier le rendu complet**

Recharger `http://localhost:8000`.
Expected :
- Le menu en haut liste « Portfolios » et « Typographie » (cliquables).
- Deux sections affichées, chacune avec une grille de cartes.
- Chaque carte montre un favicon + le nom, et s'ouvre dans un nouvel onglet au clic.

- [ ] **Step 3: Vérifier le menu d'ancres**

Cliquer sur « Typographie » dans le menu.
Expected : la page défile jusqu'à la section Typographie (le titre n'est pas masqué par le header collant — `scroll-margin-top` gère ça).

- [ ] **Step 4: Vérifier le repli favicon**

Ajouter temporairement dans `links.json` un lien avec un domaine sans favicon, par ex. `{ "nom": "Test Repli", "url": "https://exemple-domaine-inexistant-xyz.test" }`, recharger.
Expected : une pastille colorée avec la lettre « T » s'affiche à la place du favicon. **Retirer ensuite ce lien de test.**

- [ ] **Step 5: Vérifier le responsive**

Réduire progressivement la largeur de la fenêtre (ou outils dev).
Expected : la grille passe de 4 → 3 → 2 → 1 colonne(s) aux seuils.

- [ ] **Step 6: Commit**

```bash
git add app.js links.json
git commit -m "feat: rendu des categories, cartes et favicons"
```

---

### Task 5: README + préparation du déploiement GitHub Pages

**Files:**
- Create: `README.md`
- Test: relecture

**Interfaces:**
- Consumes: rien.
- Produces: documentation utilisateur.

- [ ] **Step 1: Créer `README.md`**

```markdown
# Annuaire d'inspiration

Un annuaire statique de sites d'inspiration, regroupés par catégorie.
Hébergé sur GitHub Pages. Aucune étape de build.

## Ajouter un lien

Éditer `links.json`. Dans la catégorie voulue, ajouter un objet au tableau `liens` :

\`\`\`json
{ "nom": "Nom du site", "url": "https://exemple.com" }
\`\`\`

## Ajouter une catégorie

Ajouter un objet au tableau racine de `links.json` :

\`\`\`json
{
  "categorie": "Nouvelle catégorie",
  "liens": [
    { "nom": "Un site", "url": "https://exemple.com" }
  ]
}
\`\`\`

L'ordre dans le fichier détermine l'ordre d'affichage.

## Tester en local

Le site fait un `fetch('links.json')` qui ne marche pas en ouvrant le fichier
directement (`file://`). Lancer un petit serveur :

\`\`\`bash
python3 -m http.server 8000
\`\`\`

Puis ouvrir http://localhost:8000

## Déployer sur GitHub Pages

1. Pousser le dépôt sur GitHub.
2. Settings → Pages → Source : la branche par défaut, dossier `/ (root)`.
3. Le site est publié à l'URL indiquée par GitHub.
```

- [ ] **Step 2: Vérifier**

Relire le `README.md` : les instructions correspondent aux fichiers réels (`links.json`, `python3 -m http.server`).

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: README avec ajout de liens et deploiement"
```

---

## Self-Review

**1. Spec coverage :**
- Sections par catégorie qui se suivent → Task 4 (`buildCategory`). ✅
- Grille de cartes favicon + nom, ouverture nouvel onglet → Task 4 (`buildCard`). ✅
- Menu d'ancres → Task 4 (`buildMenu`) + `scroll-margin-top` en Task 3. ✅
- Mode sombre par défaut → Task 3. ✅
- Grille 4/3/2/1 colonnes responsive → Task 3 (media queries). ✅
- Données dans `links.json` édité main → Task 1 + Task 5 (README). ✅
- Favicon Google + repli lettre → Task 4 (`buildCard` error handler) + style `.card-fallback` Task 3. ✅
- Gestion erreurs (introuvable / JSON cassé / vide) → Task 2. ✅
- Pas de build, statique, racine GitHub Pages → respecté partout, déploiement Task 5. ✅
- Vérification manuelle (charge, liens, ancres, repli, erreurs, responsive) → couverte par les steps de vérif Tasks 2-4. ✅

**2. Placeholder scan :** Le `render` « minimal » de Task 2 est intentionnel et explicitement remplacé en Task 4 (pas un TODO non résolu). Aucun « TBD/à compléter » résiduel. ✅

**3. Type consistency :** `loadData`, `showMessage`, `render`, `slugify`, `buildMenu`, `buildCategory`, `buildCard` nommées de façon cohérente entre tasks. Classes CSS de Task 3 alignées avec celles produites par Task 4 (`.category`, `.category-title`, `.cards`, `.card`, `.card-favicon`, `.card-fallback`, `.card-name`). Ids `#app` / `#categories-menu` cohérents entre Task 1, 2 et 4. ✅

**Note git :** le dépôt n'est pas encore initialisé. Avant le premier `git commit` (Task 1), lancer `git init` à la racine. À décider avec l'utilisateur au moment de l'exécution.
