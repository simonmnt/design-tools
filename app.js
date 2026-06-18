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
