// split-a.js – transforme les lettres A en deux moitiés avec deux traits horizontaux

(function() {
  function splitLettersA() {
    // Cibler les titres principaux
    const targets = document.querySelectorAll('.hero-title, .hero-subtitle');
    if (!targets.length) return;

    targets.forEach(el => {
      // Sauvegarder le texte brut (évite de retraiter plusieurs fois)
      if (el.getAttribute('data-split') === 'done') return;
      let html = el.innerHTML;

      // Remplacer chaque A majuscule (entouré de non-lettres ou en début/fin de chaîne)
      // On utilise une regex pour capturer les A isolés (pas à l'intérieur d'un mot comme "GAP" -> le A est au milieu)
      // Pour "GAP", on veut remplacer le A, donc on cherche toute occurrence de A.
      // Version simple : remplacer chaque A, même dans un mot.
      html = html.replace(/A/g, (match, offset) => {
        // On pourrait être plus fin, mais on remplace tous les A.
        return `<span class="split-a">
          <span class="a-half a-left">A</span>
          <span class="a-bar bar-top"></span>
          <span class="a-bar bar-bottom"></span>
          <span class="a-half a-right">A</span>
        </span>`;
      });

      el.innerHTML = html;
      el.setAttribute('data-split', 'done');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', splitLettersA);
  } else {
    splitLettersA();
  }
})();