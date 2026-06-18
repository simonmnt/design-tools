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

  // Couleur dominante du favicon : moyenne pondérée par la saturation,
  // en ignorant les pixels transparents, quasi blancs ou quasi noirs.
  function dominantColor(img) {
    const size = 32;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, size, size);

    let pixels;
    try {
      pixels = ctx.getImageData(0, 0, size, size).data;
    } catch (e) {
      return null; // canvas "tainted" : on abandonne proprement
    }

    let r = 0, g = 0, b = 0, total = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const pr = pixels[i], pg = pixels[i + 1], pb = pixels[i + 2], pa = pixels[i + 3];
      if (pa < 128) continue;
      const max = Math.max(pr, pg, pb), min = Math.min(pr, pg, pb);
      if (max > 244 && min > 244) continue; // quasi blanc
      if (max < 12) continue;                // quasi noir
      const weight = (max - min) + 12;        // saturation + base pour les logos gris
      r += pr * weight; g += pg * weight; b += pb * weight; total += weight;
    }
    if (total === 0) return null;
    return "rgb(" + Math.round(r / total) + " " + Math.round(g / total) + " " + Math.round(b / total) + ")";
  }

  function buildCard(lien) {
    const card = document.createElement("a");
    card.className = "card";
    card.href = lien.url;
    card.target = "_blank";
    card.rel = "noopener noreferrer";

    let domain = "";
    try { domain = new URL(lien.url).hostname.replace(/^www\./, ""); } catch (e) { domain = ""; }

    const img = document.createElement("img");
    img.className = "card-favicon";
    img.alt = "";
    img.loading = "lazy";
    img.crossOrigin = "anonymous"; // nécessaire pour lire les pixels (favicone.com renvoie ACAO *)
    img.src = "https://favicone.com/" + encodeURIComponent(domain) + "?s=64";
    img.addEventListener("load", function () {
      const color = dominantColor(img);
      if (color) card.style.setProperty("--accent", color);
    });
    img.addEventListener("error", function () {
      const fallback = document.createElement("span");
      fallback.className = "card-fallback";
      fallback.textContent = (lien.nom || "?").charAt(0);
      img.replaceWith(fallback);
    });

    const body = document.createElement("div");
    body.className = "card-body";

    const name = document.createElement("span");
    name.className = "card-name";
    name.textContent = lien.nom;
    body.appendChild(name);

    card.appendChild(img);
    card.appendChild(body);
    return card;
  }

  function buildCategory(cat) {
    const section = document.createElement("section");
    section.className = "category";
    section.id = slugify(cat.categorie);

    const header = document.createElement("div");
    header.className = "category-header";

    const title = document.createElement("h2");
    title.className = "category-title";
    title.textContent = cat.categorie;
    header.appendChild(title);

    const liens = cat.liens || [];

    const count = document.createElement("span");
    count.className = "category-count";
    count.textContent = liens.length;
    header.appendChild(count);

    section.appendChild(header);

    const grid = document.createElement("div");
    grid.className = "cards";
    liens.forEach(function (lien) {
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
