# GAP — Input commun (base de marque) pour Claude Design

> **Document de référence, pas de consignes.** C'est le socle partagé. Deux jeux de consignes d'action s'y brancheront **séparément**, dans deux conversations distinctes :
> 1. **Design system + catalogue de templates sociaux** (explorer, adapter au branding, décliner en variété).
> 2. **Éditeur de texte social** (l'outil de remplissage).
>
> Ce fichier ne dit *rien* sur quoi construire — il dit *qui est la marque et quelles sont ses règles*. Fourni avec : la branche GitHub du site, le PDF de marque (`vlogo_adapt.pdf`) et les assets sociaux (A/B/C.png, fonds, logo A).

---

## Le projet

**The Gap Group BXL** — collectif d'artistes à Bruxelles, programme de mentorat « Pairing is Caring » qui met en relation artistes émergent·e·s et mentor·e·s expérimenté·e·s. Site : thegap-groupbxl.com.

**L'identité repose sur une font variable** : **Obviously Variable** (OhnoType), dont les axes `ital` / `wght` / `wdth` *sont* le langage de marque. Préserver ces axes exactement est le principe central — c'est ce qui distingue GAP et ce qui interdit les outils qui aplatissent la typo.

- Typekit : `https://use.typekit.net/scu0dna.css`
- Famille CSS : `"obviously-variable"`
- Axes : `ital`, `wght`, `wdth`

---

## ⭐ Les styles typographiques, isolés

Les « styles » de GAP ne sont pas des réglages d'axes libres — ce sont des **rôles nommés**, chacun portant un jeu d'axes fixe. C'est la pièce maîtresse de ce document.

### Les rôles, en données

```js
// Chaque rôle = un jeu d'axes + un squish vertical.
// La TAILLE et la COULEUR ne sont PAS dans le rôle (voir règles ci-dessous).
const ROLES = {
  // — Tier display (signature) —
  displayHeavy: { label: "Display Heavy", ital: 0, wght: 803, wdth: 121, squishY: 0.88 }, // GAP, GROUP, wordmark, gros titres
  displayMid:   { label: "Display Mid",   ital: 0, wght: 699, wdth: 121, squishY: 0.88 }, // PAIRING IS CARING
  displayLight: { label: "Display Light", ital: 0, wght: 500, wdth: 100, squishY: 0.88 }, // THE, BXL (mots extérieurs du wordmark)
  call:         { label: "Call",          ital: 0, wght: 480, wdth: 100, squishY: 1 },    // accroche / tagline
  button:       { label: "Button",        ital: 0, wght: 650, wdth: 100, squishY: 1 },    // bouton
  caption:      { label: "Caption",       ital: 0, wght: 320, wdth: 100, squishY: 1 },    // footer / mentions

  // — Tier texte courant —
  body:         { label: "Body",          ital: 0, wght: 400, wdth: 100, squishY: 1 },
  bodyStrong:   { label: "Body Strong",   ital: 0, wght: 700, wdth: 100, squishY: 1 },
  heading:      { label: "Heading",       ital: 0, wght: 650, wdth: 110, squishY: 1 },
  lede:         { label: "Lede",          ital: 0, wght: 500, wdth: 100, squishY: 1 },
  subtitle:     { label: "Subtitle",      ital: 0, wght: 550, wdth: 105, squishY: 1 },
};
```

Forme CSS d'un rôle (exemple Display Heavy) :

```css
font-family: "obviously-variable", sans-serif;
font-optical-sizing: auto;
font-variation-settings: "ital" 0, "wght" 803, "wdth" 121;
transform: scaleY(0.88);          /* le squish */
transform-origin: bottom left;
text-transform: uppercase;         /* les rôles display sont en capitales */
line-height: 0.92;
```

### Trois règles de fidélité

1. **Le squish `scaleY(0.88)` fait partie de l'identité.** Tous les rôles display sont écrasés verticalement à 0.88 (`transform-origin: bottom left`). Sans lui, le rendu ne ressemble pas à la marque. (Les rôles texte courant n'ont pas de squish → `squishY: 1`.)

2. **La taille n'est pas dans le rôle, et l'échelle est φ-based.** Le système de tailles suit un ratio **1.618** (taille principale, puis `÷ 1.618` pour le cran inférieur, etc.). Les tailles du site sont en unités relatives au viewport, non transférables telles quelles — c'est le **ratio φ** qui est la règle portable. Exemple d'échelle (px, à caler selon le format) : `~46 / 74 / 120 / 194`.

3. **La couleur n'est pas dans le rôle.** Le même rôle est **blanc** sur fond sombre/coloré, **encre (`#0F0E0C`)** sur fond clair — ça dépend du fond, pas du rôle. (Vérifiable sur les assets : wordmark blanc dans le hero, noir posé sur une zone claire.)

Détail : l'axe `ital` est **toujours 0** dans le CSS existant — le seul texte « italique » (mentions partenaires) passe par `font-style: italic`, pas par l'axe. Un vrai rôle italique devrait piloter `"ital" 1` via l'axe.

### Les A-ponts (signature graphique)

Sur certaines lettres **A**, la barre devient un **pont horizontal étirable** — visible dans G**A**P, P**A**IRING, C**A**RING. Caractéristiques :
- C'est un **élément graphique vectoriel** (SVG), pas un simple glyphe — sa **longueur est variable** (très étiré dans le wordmark, modéré dans « PAIRING IS CARING »).
- Il existe déjà, codé en **SVG piloté par GSAP** (logique dans `main.js`), avec un **paramètre de longueur unique** qui sert à l'étirer (et à l'animer).
- Réf isolée : `IN_LOGO.png` (le A seul avec son aura).

### Palette de marque

```
Base / froide (fonds) :  #ECE8E3   #DCE7F0   #D6D3E2   #C4D4E8   #F0DDC9
Aura / chaude (accent) : #F45800 → #F47B00 → #FFCBA4    (versions douces ~#D95030 / #F0A06E)
Encre : #0F0E0C         Papier : #F0ECE4
```

---

## Carte du code — quoi lire, quoi ignorer

**À LIRE (source de vérité typo) :**
- `style.css` — rôles de la home (wordmark, PAIRING IS CARING, call, bouton, footer). **Source principale.**
- `pages.css` — rôles des pages intérieures (titres, corps, lede, sous-titre, caption).
- `newstyle.css` — variante V2, quasi identique à `style.css` (confirmation, pas source distincte).
- `index.html` / `about.html` / `programme.html` — les rôles **en usage** + la structure des A-ponts (`<span data-a-anim data-a-id="…">A</span>`).
- `main.js` — la logique **GSAP des A-ponts** (mécanisme d'étirement).

**À IGNORER :**
- `styles.css` (avec **s** final) — **feuille legacy** (font `DINdong`, auras CSS) **plus en service**. Elle induit en erreur : ne pas s'en servir pour les rôles.
- `anim/lvl4…lvl8/` — moteur d'animation physique + ses panneaux de contrôle. Hors sujet pour la marque/typo. (`lvl8` = version courante, si jamais utile pour le fond animé.)

---

## Les assets de marque, décodés

Le **langage visuel** de référence :
- **`A.png` / `B.png` / `C.png`** — posts sociaux faits main. Montrent la grammaire : Display Mid (PAIRING IS CARING) + headlines + meta (dates) + fond gradient + aura orange. `B.png` (« Seeking… ») illustre un usage où les **graisses sont mixées en ligne** dans un même bloc.
- **`vlogo_adapt.pdf`** — p.1 : lockup de marque (THE GAP GROUP BXL + PAIRING IS CARING + logos partenaires) ; p.2-7 : texte multilingue EN/FR/NL décrivant le collectif (source de copie).
- **`Fond_base.png`** — un fond curé (gradient froid + aura). Exemple du **type de fond** de la marque.
- **Capture du générateur de gradient** (Soft Bézier / Oval warp ; palette ECE8E3 / DCE7F0 / D6D3E2 / F0DDC9) — l'outil qui fabrique les fonds : **gradients warpés doux** dans la palette froide, parfois + aura orange.
- **`IN_LOGO.png`** — le **A-pont isolé**.
- **Captures du site live** (home + programme) — tous les rôles en production : wordmark avec A-pont étiré, Display Mid, Call, Button, Heading, Body, Body Strong.

---

*Fin de l'input commun. Les consignes d'action (catalogue de templates d'un côté, éditeur de l'autre) viendront séparément et s'appuieront sur ce socle.*
