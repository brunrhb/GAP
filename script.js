/* The Gap Group BXL — UI interactions
   - language switch (FR / EN / NL)
   - mobile menu toggle
*/

(function () {
  const STORAGE_KEY = 'tgg-lang';
  const validLangs = ['fr', 'en', 'nl'];

  function setLang(lang) {
    if (!validLangs.includes(lang)) lang = 'fr';
    const html = document.documentElement;
    validLangs.forEach(l => html.classList.remove('show-' + l));
    html.classList.add('show-' + lang);
    html.setAttribute('lang', lang);
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}

    document.querySelectorAll('[data-lang-btn]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-lang-btn') === lang);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    // Initialize language (saved preference, else default FR)
    let initial = 'en';
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && validLangs.includes(saved)) initial = saved;
    } catch (e) {}
    setLang(initial);

    // Language buttons
    document.querySelectorAll('[data-lang-btn]').forEach(btn => {
      btn.addEventListener('click', () => setLang(btn.getAttribute('data-lang-btn')));
    });

    // Mobile menu toggle
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.main-nav');
    if (toggle && nav) {
      toggle.addEventListener('click', () => {
        const open = nav.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(open));
      });
    }
  });
})();
