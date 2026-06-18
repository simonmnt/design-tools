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

  loadData()
    .then(render)
    .catch(function (err) {
      showMessage("Erreur de chargement : " + err.message);
    });
})();
